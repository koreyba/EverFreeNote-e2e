import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { request, type APIRequestContext } from '@playwright/test';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/** Path to the browser storage state saved after login (contains Supabase auth cookie). */
const STORAGE_STATE_PATH = path.resolve(__dirname, '..', 'playwright', '.auth', 'user.json');

/** Decoded Supabase JWT session extracted from the auth cookie. */
type SupabaseSession = {
  access_token: string;
  token_type: string;
  expires_at?: number;
};

/** Decodes a Base64-URL encoded string (used in JWTs and Supabase cookies). */
const decodeBase64Url = (input: string) => {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  if (pad === 3) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
};

/**
 * Reads the Supabase session from the saved browser storage state.
 * Finds the auth cookie, decodes it from Base64, and returns the session object.
 */
const readSession = (storagePath = STORAGE_STATE_PATH): SupabaseSession => {
  if (!fs.existsSync(storagePath)) {
    throw new Error(`Storage state not found: ${storagePath}`);
  }

  const raw = fs.readFileSync(storagePath, 'utf-8');
  const state = JSON.parse(raw) as { cookies?: Array<{ name: string; value: string }> };
  const cookie = state.cookies?.find((c) => c.name.includes('-auth-token'));
  if (!cookie) {
    throw new Error('Supabase auth cookie not found in storage state.');
  }

  const base64Value = cookie.value.replace(/^base64-/, '');
  return JSON.parse(decodeBase64Url(base64Value)) as SupabaseSession;
};

/**
 * Resolves the Supabase Edge Functions base URL.
 * Uses `SUPABASE_FUNCTIONS_URL` env var if set, otherwise extracts it from the JWT issuer claim.
 */
const getBaseUrl = (): string => {
  if (process.env.SUPABASE_FUNCTIONS_URL) {
    return process.env.SUPABASE_FUNCTIONS_URL.replace(/\/$/, '') + '/';
  }

  const session = readSession();
  const parts = session.access_token.split('.');
  if (parts.length < 2) throw new Error('Invalid JWT: missing payload.');

  const payload = JSON.parse(decodeBase64Url(parts[1]));
  const issuer = payload?.iss as string | undefined;
  if (!issuer) throw new Error('Supabase issuer (iss) not found in access token.');

  return `${issuer.replace(/\/auth\/v1$/, '')}/functions/v1/`;
};

/**
 * Builds auth headers (Bearer token + optional apikey) from the saved session.
 */
const getHeaders = (): Record<string, string> => {
  const session = readSession();
  if (!session.access_token) {
    throw new Error('Supabase access_token not found in auth cookie.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };

  if (process.env.SUPABASE_ANON_KEY) {
    headers.apikey = process.env.SUPABASE_ANON_KEY;
  }

  return headers;
};

/**
 * Creates an authenticated Playwright {@link APIRequestContext} for Supabase Edge Functions.
 * Reads credentials from saved browser storage state and configures base URL + auth headers.
 *
 * @example
 * ```ts
 * const api = await createAuthedContext();
 * const res = await api.get('get-notes');
 * ```
 */
export const createAuthedContext = async (): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL: getBaseUrl(),
    extraHTTPHeaders: getHeaders(),
  });
};
