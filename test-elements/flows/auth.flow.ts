import { expect, type Page } from '@playwright/test';
import { LandingView } from '../views/landing.view';

export const loginWithPersistentTestUser = async (page: Page) => {
  const landing = new LandingView(page);
  await page.goto('/');
  await expect(landing.testLoginButton).toBeVisible();
  await landing.testLoginButton.click();
};
