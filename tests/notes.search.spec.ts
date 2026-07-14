import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import type { Note } from '../test-api/notes.types';


const FULL_TEXT_QUERY_PREFIX = 'ftsq';

let createdNoteIds: string[] = [];
let filterTag = '';
let fullTextQuery = '';
let noteMatchedWithTag: Note;
let noteMatchedWithoutTag: Note;
let noteNotMatchedButWithTag: Note;
let noteMatchedWithTagBodyText = '';

test.describe('notes search', () => {
  test.beforeEach(async ({ notesApi, page }) => {
    // Build unique identifiers so this run does not collide with shared test data.
    createdNoteIds = [];
    const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    filterTag = `search-tag-${runId}`;
    const nonFilterTag = `search-other-tag-${runId}`;
    fullTextQuery = `${FULL_TEXT_QUERY_PREFIX}${runId.replace(/[^a-zA-Z0-9]/g, '')}`;
    noteMatchedWithTagBodyText = `keep body ${fullTextQuery}`;
    const noteMatchedWithoutTagBodyText = `drop body ${fullTextQuery}`;
    const noteNotMatchedButWithTagBodyText = `hidden body ${runId}`;

    // Seed a note that should match long full-text query and remain after tag filtering.
    const noteCreatedWithTag = await notesApi.createNote({
      title: `keep ${runId}`,
      description: `<p>${noteMatchedWithTagBodyText}</p>`,
      tags: [filterTag],
    });
    expect(noteCreatedWithTag.status).toBe(200);
    noteMatchedWithTag = noteCreatedWithTag.data.note;
    createdNoteIds.push(noteMatchedWithTag.id);

    // Seed a note that should match both queries but be removed by tag filtering.
    const noteCreatedWithoutTag = await notesApi.createNote({
      title: `drop ${runId}`,
      description: `<p>${noteMatchedWithoutTagBodyText}</p>`,
      tags: [nonFilterTag],
    });
    expect(noteCreatedWithoutTag.status).toBe(200);
    noteMatchedWithoutTag = noteCreatedWithoutTag.data.note;
    createdNoteIds.push(noteMatchedWithoutTag.id);

    // Seed a note that shares the filter tag but should not match either query.
    const noteCreatedNotMatchedButWithTag = await notesApi.createNote({
      title: `aa hidden ${runId}`,
      description: `<p>${noteNotMatchedButWithTagBodyText}</p>`,
      tags: [filterTag],
    });
    expect(noteCreatedNotMatchedButWithTag.status).toBe(200);
    noteNotMatchedButWithTag = noteCreatedNotMatchedButWithTag.data.note;
    createdNoteIds.push(noteNotMatchedButWithTag.id);

    // Open the app after API setup is complete.
    await page.goto('/');
  });

  test.afterEach(async ({ notesApi }) => {
    // Remove all notes created by this test run.
    for (const noteId of createdNoteIds) {
      try {
        await notesApi.deleteNote(noteId);
      } catch {
        // Best-effort cleanup to keep shared environment stable.
      }
    }
  });

  test('long query search shows full-text results and supports tag filtering', async ({
    leftPanel,
    readView,
    analyzeA11y,
  }, testInfo) => {

    await test.step('perform full-text search', async () => {
      // Start with long-query mode (> 3 characters).
      await leftPanel.searchControls.openGlobalSearch();
      await leftPanel.searchControls.search(fullTextQuery);

      // Ensure full-text result block is visible and includes cheap signal checks.
      await expect(
        leftPanel.searchControls.clearSearchButton,
        'Clear search button should be visible after entering long query',
      ).toBeVisible();
      await expect(
        leftPanel.fullTextSearchResults.foundNotesText,
        'Full-text results should report two found notes before tag filtering',
      ).toHaveText('Found: 2 notes');
    });

    await test.step('Accessibility scan: Search Panel', async () => {
      const a11y = await analyzeA11y();
      if (a11y.hasViolations()) {
        await testInfo.attach('a11y-report-search-panel.md', {
          body: a11y.format(),
          contentType: 'text/markdown',
        });
      }
      expect.soft(
        a11y.hasViolations(),
        'Accessibility scan on "Search Panel" should have no violations',
      ).toBe(false);
    });

    await test.step('verify search results content', async () => {
      await expect(
        leftPanel.fullTextSearchResults.searchDurationText,
        'Search duration should be shown in milliseconds',
      ).toHaveText(/^\d+ms$/);
      await expect(
        leftPanel.fullTextSearchResults.highlightedFragments.first(),
        'At least one highlighted fragment should be visible in full-text results',
      ).toBeVisible();

      // Validate query-only results: expected notes are present and unrelated one is absent.
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithTag.title),
        `Result card for "${noteMatchedWithTag.title}" should be visible in full-text search`,
      ).toBeVisible();
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithoutTag.title),
        `Result card for "${noteMatchedWithoutTag.title}" should be visible in full-text search`,
      ).toBeVisible();
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteNotMatchedButWithTag.title),
        `Result card for "${noteNotMatchedButWithTag.title}" should not be visible in full-text search`,
      ).toHaveCount(0);
    });

    await test.step('apply tag filter', async () => {
      // Apply tag filter inside the full-text result list.
      await leftPanel.fullTextSearchResults.clickTagChip(noteMatchedWithTag.title, filterTag);

      // Confirm both filters are active and only one expected result remains.
      await expect(
        leftPanel.searchControls.clearTagsButton,
        'Clear tags button should be visible after applying full-text tag filter',
      ).toBeVisible();

      await expect(
        leftPanel.fullTextSearchResults.foundNotesText,
        'Full-text results should report one note after tag filtering',
      ).toHaveText('Found: 1 note');
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithTag.title),
        `Result card for "${noteMatchedWithTag.title}" should remain after full-text tag filter`,
      ).toBeVisible();
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithoutTag.title),
        `Result card for "${noteMatchedWithoutTag.title}" should be excluded by full-text tag filter`,
      ).toHaveCount(0);
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteNotMatchedButWithTag.title),
        `Result card for "${noteNotMatchedButWithTag.title}" should remain excluded in full-text + tag mode`,
      ).toHaveCount(0);
    });

    await test.step('clear text query and keep tag scope', async () => {
      await leftPanel.searchControls.clearSearch();
      await expect(
        leftPanel.searchControls.searchInput.first(),
        'Search input should be empty after clearing long query',
      ).toBeEmpty();
      await expect(
        leftPanel.searchControls.clearTagsButton,
        'Tag filter should remain active after clearing only long query text',
      ).toBeVisible();

      await expect(
        leftPanel.fullTextSearchResults.foundNotesText,
        'Clearing long query should keep tag-only search results in the panel',
      ).toHaveText('Found: 2 notes');
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithTag.title),
        `Tagged note "${noteMatchedWithTag.title}" should remain visible in tag-only mode`,
      ).toBeVisible();
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteNotMatchedButWithTag.title),
        `Tagged note "${noteNotMatchedButWithTag.title}" should be visible in tag-only mode`,
      ).toBeVisible();
      await expect(
        leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithoutTag.title),
        `Untagged note "${noteMatchedWithoutTag.title}" should remain excluded in tag-only mode`,
      ).toHaveCount(0);
    });

    await test.step('open a note and verify its content', async () => {
      // Open the remaining result and verify its body content in read mode.
      await leftPanel.fullTextSearchResults.clickResultCard(noteMatchedWithTag.title);
      await expect(
        readView.readingHeading,
        'Reading view heading should be visible after opening full-text search result',
      ).toBeVisible();
      await expect(
        readView.noteText,
        'Reading view should show body text from the opened full-text result note',
      ).toContainText(noteMatchedWithTagBodyText);
    });

  });
});
