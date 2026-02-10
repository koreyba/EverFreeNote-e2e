import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { request, type APIRequestContext } from '@playwright/test';
import {
  AUTH_STORAGE_STATE_PATH,
  createPersistentAuthStorageState,
} from '../test-utils/auth-state';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const EXPIRY_SAFETY_WINDOW_SECONDS = 5 * 60;

/** Cookie structure used in Playwright storage state. */
type StorageStateCookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

/** Minimal storage state shape required for auth cookie operations. */
type StorageState = {
  cookies?: StorageStateCookie[];
  origins?: unknown[];
};

/** Decoded Supabase JWT session extracted from the auth cookie. */
type SupabaseSession = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
};

type JwtPayload = {
  iss?: string;
};

/** Expected payload from Supabase refresh endpoint. */
type RefreshTokenResponse = {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
};

type EnsureSessionOptions = {
  forceRefresh?: boolean;
};

/** Decodes a Base64-URL encoded string (used in JWTs and Supabase cookies). */
const decodeBase64Url = (input: string) => {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  if (pad === 3) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
};

/** Encodes a UTF-8 string to Base64-URL format (without padding). */
const encodeBase64Url = (input: string) => {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/** Matches only canonical Supabase auth token cookie names. */
const isSupabaseAuthTokenCookie = (cookieName: string) => /^sb-[^-]+-auth-token$/.test(cookieName);

/** Reads and parses Playwright storage state from disk. */
const readStorageState = (storagePath = AUTH_STORAGE_STATE_PATH): StorageState => {
  if (!fs.existsSync(storagePath)) {
    throw new Error(`Storage state not found: ${storagePath}`);
  }

  const raw = fs.readFileSync(storagePath, 'utf-8');
  return JSON.parse(raw) as StorageState;
};

/** Atomically writes storage state to avoid partially-written auth files. */
const writeStorageState = (state: StorageState, storagePath = AUTH_STORAGE_STATE_PATH) => {
  const tempPath = `${storagePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tempPath, storagePath);
};

/** Returns the single Supabase auth cookie, enforcing strict cardinality. */
const getAuthCookie = (state: StorageState): StorageStateCookie => {
  const authCookies = (state.cookies ?? []).filter((cookie) =>
    isSupabaseAuthTokenCookie(cookie.name),
  );

  if (authCookies.length === 0) {
    throw new Error('Supabase auth cookie not found in storage state.');
  }

  if (authCookies.length > 1) {
    throw new Error(
      `Expected one Supabase auth cookie, found ${authCookies.length}. ` +
        'Provide a single auth cookie in storage state.',
    );
  }

  return authCookies[0];
};

/** Decodes and validates Supabase session payload stored inside auth cookie. */
const parseSessionFromCookie = (cookie: StorageStateCookie): SupabaseSession => {
  const base64Value = cookie.value.replace(/^base64-/, '');
  const parsed = JSON.parse(decodeBase64Url(base64Value)) as SupabaseSession;

  if (!parsed.access_token) {
    throw new Error('Supabase access_token not found in auth cookie.');
  }

  return parsed;
};

/** Reads the Supabase session from the saved browser storage state. */
const readSession = (storagePath = AUTH_STORAGE_STATE_PATH): SupabaseSession => {
  const state = readStorageState(storagePath);
  const cookie = getAuthCookie(state);
  return parseSessionFromCookie(cookie);
};

/** Persists refreshed session fields back into the auth cookie. */
const writeSession = (session: SupabaseSession, storagePath = AUTH_STORAGE_STATE_PATH) => {
  const state = readStorageState(storagePath);
  const cookie = getAuthCookie(state);

  cookie.value = `base64-${encodeBase64Url(JSON.stringify(session))}`;

  if (typeof session.expires_at === 'number') {
    cookie.expires = session.expires_at;
  }

  writeStorageState(state, storagePath);
};

/** Extracts and parses JWT payload section from access token. */
const readJwtPayload = (accessToken: string): JwtPayload => {
  const parts = accessToken.split('.');

  if (parts.length < 2) {
    throw new Error('Invalid JWT: missing payload segment.');
  }

  return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
};

/** Resolves Supabase issuer URL from access token payload. */
const getIssuerFromSession = (session: SupabaseSession): string => {
  const payload = readJwtPayload(session.access_token);
  const issuer = payload.iss;

  if (!issuer) {
    throw new Error('Supabase issuer (iss) not found in access token.');
  }

  return issuer;
};

/** Resolves the Supabase Edge Functions base URL. */
const getFunctionsBaseUrl = (session: SupabaseSession): string => {
  if (process.env.SUPABASE_FUNCTIONS_URL) {
    return process.env.SUPABASE_FUNCTIONS_URL.replace(/\/$/, '') + '/';
  }

  const issuer = getIssuerFromSession(session);
  return `${issuer.replace(/\/auth\/v1$/, '')}/functions/v1/`;
};

/** Builds Supabase Auth API base URL used for refresh token exchange. */
const getAuthBaseUrl = (session: SupabaseSession): string => {
  const issuer = getIssuerFromSession(session);
  return `${issuer.replace(/\/auth\/v1$/, '')}/auth/v1/`;
};

/** Builds auth headers (Bearer token + optional apikey) from the saved session. */
const getHeaders = (session: SupabaseSession): Record<string, string> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };

  if (process.env.SUPABASE_ANON_KEY) {
    headers.apikey = process.env.SUPABASE_ANON_KEY;
  }

  return headers;
};

/** Builds headers for refresh-token requests to Supabase Auth API. */
const getRefreshHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.SUPABASE_ANON_KEY) {
    headers.apikey = process.env.SUPABASE_ANON_KEY;
  }

  return headers;
};

/** Returns remaining lifetime in seconds for current access token. */
const getSessionTtlSeconds = (session: SupabaseSession): number => {
  if (typeof session.expires_at !== 'number') {
    return Number.POSITIVE_INFINITY;
  }

  return session.expires_at - Math.floor(Date.now() / 1000);
};

/** Checks whether the current session is near expiry threshold. */
const isSessionExpiringSoon = (session: SupabaseSession): boolean => {
  return getSessionTtlSeconds(session) <= EXPIRY_SAFETY_WINDOW_SECONDS;
};

/** Exchanges refresh token for a new Supabase session payload. */
const refreshSession = async (session: SupabaseSession): Promise<SupabaseSession> => {
  if (!session.refresh_token) {
    throw new Error('Supabase refresh_token is missing in auth session.');
  }

  const refreshContext = await request.newContext({
    baseURL: getAuthBaseUrl(session),
    extraHTTPHeaders: getRefreshHeaders(),
  });

  try {
    const response = await refreshContext.post('token?grant_type=refresh_token', {
      data: { refresh_token: session.refresh_token },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Refresh failed with status ${response.status()}: ${body}`);
    }

    const refreshed = (await response.json()) as RefreshTokenResponse;

    if (!refreshed.access_token) {
      throw new Error('Refresh succeeded but access_token is missing in response.');
    }

    return {
      access_token: refreshed.access_token,
      token_type: refreshed.token_type ?? session.token_type,
      refresh_token: refreshed.refresh_token ?? session.refresh_token,
      expires_at:
        typeof refreshed.expires_at === 'number'
          ? refreshed.expires_at
          : typeof refreshed.expires_in === 'number'
            ? Math.floor(Date.now() / 1000) + refreshed.expires_in
            : session.expires_at,
      expires_in: refreshed.expires_in,
    };
  } finally {
    await refreshContext.dispose();
  }
};

/** Reads BASE_URL used for UI-login fallback during auth recovery. */
const getBaseUrlForUiAuth = (): string => {
  const baseURL = process.env.BASE_URL;

  if (!baseURL) {
    throw new Error(
      'BASE_URL is required to regenerate storage state after token refresh failure.',
    );
  }

  return baseURL;
};

/** Ensures usable session by refresh or full storage state regeneration fallback. */
const ensureFreshSession = async (options: EnsureSessionOptions = {}): Promise<SupabaseSession> => {
  let session = readSession();
  const shouldRefresh = options.forceRefresh || isSessionExpiringSoon(session);

  if (!shouldRefresh) {
    return session;
  }

  try {
    const refreshed = await refreshSession(session);
    writeSession(refreshed);

    return refreshed;
  } catch {
    await createPersistentAuthStorageState(getBaseUrlForUiAuth());
    session = readSession();

    if (isSessionExpiringSoon(session)) {
      throw new Error(
        'Storage state was regenerated, but access token is still expired or close to expiry.',
      );
    }

    return session;
  }
};

/**
 * Creates an authenticated Playwright {@link APIRequestContext} for Supabase Edge Functions.
 * Auth is refreshed on demand and can self-heal by regenerating storage state when needed.
 */
export const createAuthedContext = async (
  options: EnsureSessionOptions = {},
): Promise<APIRequestContext> => {
  const session = await ensureFreshSession(options);

  return request.newContext({
    baseURL: getFunctionsBaseUrl(session),
    extraHTTPHeaders: getHeaders(session),
  });
};
