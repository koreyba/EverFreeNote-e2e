import fs from 'fs';
import path from 'path';
import { chromium, type FullConfig } from '@playwright/test';
import { LeftPanel } from '../test-elements/views/left-panel.view';
import { loginWithPersistentTestUser } from '../test-elements/flows/auth.flow';

const authFile = path.resolve(__dirname, '..', 'playwright', '.auth', 'user.json');

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.BASE_URL;
  if (!baseURL) {
    throw new Error('BASE_URL is not set. Define it in .env or your environment.');
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  // We intentionally generate a single storageState using Chromium and reuse it across projects.
  // If auth ever becomes browser-specific, switch to per-project storageState files.
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginWithPersistentTestUser(page, baseURL);

    const leftPanel = new LeftPanel(page);
    await leftPanel.newNoteButton.waitFor({ state: 'visible' });

    await context.storageState({ path: authFile });
    await context.close();
  } finally {
    await browser.close();
  }
}
