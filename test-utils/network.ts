import type { Page, Route } from '@playwright/test';

/**
 * Playwright request resource types (mirrors request.resourceType()).
 */
export type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'image'
  | 'media'
  | 'font'
  | 'script'
  | 'texttrack'
  | 'xhr'
  | 'fetch'
  | 'eventsource'
  | 'websocket'
  | 'manifest'
  | 'other';

/**
 * Convenience presets for common network profiles.
 */
export type NetworkSpeedPreset = 'slow3g' | 'fast3g' | '4g';

/**
 * Network throttling configuration.
 */
export type NetworkThrottleOptions = {
  /** Base latency applied to matching requests (in ms). */
  latencyMs?: number;
  /** Simulated download speed (kilobytes per second). */
  downloadKbps?: number;
  /** Simulated upload speed (kilobytes per second). */
  uploadKbps?: number;
  /** Optional preset for quick setup. */
  preset?: NetworkSpeedPreset;
  /** URL pattern to match. Defaults to all requests. */
  urlPattern?: string | RegExp;
  /** Limit throttling to specific resource types (e.g. ['xhr', 'fetch', 'document']). */
  resourceTypes?: ResourceType[];
};

/**
 * Control handle for network throttling.
 */
type ThrottleHandle = {
  start: (options?: NetworkThrottleOptions) => Promise<void>;
  stop: () => Promise<void>;
};

/**
 * Preset values for latency + down/upload speeds.
 */
type PresetValues = { latencyMs: number; downloadKbps: number; uploadKbps: number };

/**
 * Simple preset mapping (latency + download/upload speed).
 */
const presets: Record<NetworkSpeedPreset, PresetValues> = {
  slow3g: { latencyMs: 400, downloadKbps: 200, uploadKbps: 100 },
  fast3g: { latencyMs: 150, downloadKbps: 750, uploadKbps: 250 },
  '4g': { latencyMs: 50, downloadKbps: 4000, uploadKbps: 1500 },
};

/**
 * Apply preset values if preset is provided (explicit options override preset).
 */
const resolveOptions = (options: NetworkThrottleOptions): NetworkThrottleOptions => {
  if (options.preset) {
    // Explicit options override preset values.
    return { ...presets[options.preset], ...options };
  }

  return options;
};

/**
 * Sleep helper (ms).
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check whether this request should be throttled by resource type.
 */
const shouldThrottle = (route: Route, resourceTypes?: ResourceType[]) => {
  if (!resourceTypes) return true;
  const type = route.request().resourceType() as ResourceType;
  return resourceTypes.includes(type);
};

/**
 * Approximate upload size in KB based on request body.
 */
const getUploadSizeKb = (route: Route) => {
  const body = route.request().postDataBuffer();
  if (!body) return 0;
  return body.length / 1024;
};

/**
 * Compute transfer time (ms) for a given size (KB) and speed (KB/s).
 */
const computeTransferMs = (sizeKb: number, speedKbps?: number) => {
  if (!speedKbps || speedKbps <= 0) return 0;
  return Math.ceil((sizeKb / speedKbps) * 1000);
};

/**
 * Build a Playwright route handler that applies latency and up/down throttling.
 */
const buildHandler = (options: NetworkThrottleOptions) => {
  const { latencyMs = 0, downloadKbps, uploadKbps, resourceTypes } = options;

  return async (route: Route) => {
    if (!shouldThrottle(route, resourceTypes)) {
      return route.continue();
    }

    const uploadDelayMs = computeTransferMs(getUploadSizeKb(route), uploadKbps);

    if (downloadKbps && downloadKbps > 0) {
      if (latencyMs + uploadDelayMs > 0) {
        await wait(latencyMs + uploadDelayMs);
      }

      const response = await route.fetch();
      const body = await response.body();
      const downloadDelayMs = computeTransferMs(body.length / 1024, downloadKbps);

      if (downloadDelayMs > 0) {
        await wait(downloadDelayMs);
      }

      return route.fulfill({ response, body });
    }

    if (latencyMs + uploadDelayMs > 0) {
      await wait(latencyMs + uploadDelayMs);
    }

    return route.continue();
  };
};

/**
 * Creates a throttler that can be started/stopped multiple times.
 * It installs a route handler and delays requests according to options.
 */
export const createNetworkThrottle = (page: Page): ThrottleHandle => {
  let current: { urlPattern: string | RegExp; handler: (route: Route) => Promise<void> } | null =
    null;
  let stopping = false;
  const inFlight = new Set<Promise<void>>();

  /**
   * Track in-flight handler promises so stop() can wait for them.
   */
  const track = (promise: Promise<void>) => {
    inFlight.add(promise);
    promise.finally(() => inFlight.delete(promise));
    return promise;
  };

  return {
    start: async (options: NetworkThrottleOptions = {}) => {
      const resolved = resolveOptions(options);
      const { urlPattern = '**/*' } = resolved;

      if (current) {
        await page.unroute(current.urlPattern, current.handler);
        current = null;
      }

      stopping = false;
      const baseHandler = buildHandler(resolved);
      const handler = (route: Route) =>
        track(
          (async () => {
            if (stopping) {
              return route.continue();
            }

            return baseHandler(route);
          })(),
        );

      await page.route(urlPattern, handler);
      current = { urlPattern, handler };
    },
    stop: async () => {
      if (!current) return;
      stopping = true;
      await Promise.allSettled([...inFlight]);
      await page.unroute(current.urlPattern, current.handler);
      current = null;
    },
  };
};
