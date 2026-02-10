import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import { LeftPanel } from '../test-elements/views/left-panel.view';
import { loginWithPersistentTestUser } from '../test-elements/flows/auth.flow';

/** Shared path to persisted Playwright auth storage state. */
export const AUTH_STORAGE_STATE_PATH = path.resolve(
  __dirname,
  '..',
  'playwright',
  '.auth',
  'user.json',
);

/**
 * Regenerates Playwright storage state for the persistent test user.
 * Used in global setup and as a fallback when API auth state becomes stale.
 */
export const createPersistentAuthStorageState = async (baseURL: string): Promise<void> => {
  fs.mkdirSync(path.dirname(AUTH_STORAGE_STATE_PATH), { recursive: true });

  // We intentionally generate auth state via Chromium and reuse it across projects.
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginWithPersistentTestUser(page, baseURL);

    const leftPanel = new LeftPanel(page);
    await leftPanel.newNoteButton.waitFor({ state: 'visible' });

    await context.storageState({ path: AUTH_STORAGE_STATE_PATH });
    await context.close();
  } finally {
    await browser.close();
  }
};
