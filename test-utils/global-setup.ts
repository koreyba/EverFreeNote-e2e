import type { FullConfig } from '@playwright/test';
import { createPersistentAuthStorageState } from './auth-state';

/** Generates fresh persistent auth state before Playwright projects start. */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.BASE_URL;

  if (!baseURL || typeof baseURL !== 'string') {
    throw new Error('BASE_URL is not set. Define it in .env or your environment.');
  }

  await createPersistentAuthStorageState(baseURL);
}
