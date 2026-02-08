import { expect, type Page } from '@playwright/test';
import { LandingView } from '../views/landing.view';

export const loginWithPersistentTestUser = async (page: Page, baseURL?: string) => {
  const landing = new LandingView(page);
  await page.goto(baseURL ?? '/');
  await expect(landing.testLoginButton).toBeVisible();
  await landing.testLoginButton.click();
};
