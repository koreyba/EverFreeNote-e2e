import { expect, test } from '../test-elements/fixtures/page-objects.fixture';

test.describe('settings accessibility audits', () => {
  test('audit Export tab accessibility', async ({
    page,
    settingsView,
    analyzeA11y,
  }, testInfo) => {
    await page.goto('/settings/?tab=export');
    await expect(
      settingsView.tabHeading,
      'Export tab heading should be visible',
    ).toHaveText('Export .enex file');

    const a11y = await analyzeA11y();
    if (a11y.hasViolations()) {
      await testInfo.attach('a11y-report-export-tab.md', {
        body: a11y.format(),
        contentType: 'text/markdown',
      });
    }

    expect(
      a11y.hasViolations(),
      'Accessibility scan on "Export Tab" should have no violations',
    ).toBe(false);
  });

  test('audit WordPress settings tab accessibility', async ({
    page,
    settingsView,
    analyzeA11y,
  }, testInfo) => {
    await page.goto('/settings/?tab=wordpress');
    await expect(
      settingsView.tabHeading,
      'WordPress settings tab heading should be visible',
    ).toHaveText('WordPress settings');

    await expect(
      settingsView.saveSettingsButton,
      'Save settings button should be enabled after loading settings',
    ).toBeEnabled();

    const a11y = await analyzeA11y();
    if (a11y.hasViolations()) {
      await testInfo.attach('a11y-report-wordpress-tab.md', {
        body: a11y.format(),
        contentType: 'text/markdown',
      });
    }

    expect(
      a11y.hasViolations(),
      'Accessibility scan on "WordPress Settings Tab" should have no violations',
    ).toBe(false);
  });

  test('audit Indexing RAG tab accessibility', async ({
    page,
    settingsView,
    analyzeA11y,
  }, testInfo) => {
    await page.goto('/settings/?tab=api-keys');
    await expect(
      settingsView.tabHeading,
      'Indexing RAG tab heading should be visible',
    ).toHaveText('Indexing (RAG)');

    await expect(
      settingsView.saveApiKeyButton,
      'Save API key button should be enabled after loading settings',
    ).toBeEnabled();

    const a11y = await analyzeA11y();
    if (a11y.hasViolations()) {
      await testInfo.attach('a11y-report-indexing-tab.md', {
        body: a11y.format(),
        contentType: 'text/markdown',
      });
    }

    expect(
      a11y.hasViolations(),
      'Accessibility scan on "Indexing (RAG) Tab" should have no violations',
    ).toBe(false);
  });

  test('audit AI Index tab accessibility', async ({
    page,
    settingsView,
    analyzeA11y,
  }, testInfo) => {
    await page.goto('/settings/?tab=ai-index');
    await expect(
      settingsView.aiIndexSearchInput,
      'AI Index search input should be visible',
    ).toBeVisible();

    const a11y = await analyzeA11y();
    if (a11y.hasViolations()) {
      await testInfo.attach('a11y-report-ai-index-tab.md', {
        body: a11y.format(),
        contentType: 'text/markdown',
      });
    }

    expect(
      a11y.hasViolations(),
      'Accessibility scan on "AI Index Tab" should have no violations',
    ).toBe(false);
  });
});
