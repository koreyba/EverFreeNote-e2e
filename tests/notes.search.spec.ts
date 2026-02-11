import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import type { Note } from '../test-api/notes.types';

const SHORT_QUERY = 'qz';
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

    // Seed a note that should match both short and full-text queries and remain after tag filtering.
    const noteCreatedWithTag = await notesApi.createNote({
      title: `${SHORT_QUERY} keep ${runId}`,
      description: `<p>${noteMatchedWithTagBodyText}</p>`,
      tags: [filterTag],
    });
    expect(noteCreatedWithTag.status).toBe(200);
    noteMatchedWithTag = noteCreatedWithTag.data.note;
    createdNoteIds.push(noteMatchedWithTag.id);

    // Seed a note that should match both queries but be removed by tag filtering.
    const noteCreatedWithoutTag = await notesApi.createNote({
      title: `${SHORT_QUERY} drop ${runId}`,
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

  test('short query search supports tag filter and excludes unexpected notes', async ({
    leftPanel,
    readView,
  }) => {
    await test.step('search a text', async () => {
      // Start with short-query search mode (<= 3 characters).
      await leftPanel.searchControls.searchInput.fill(SHORT_QUERY);

      // Ensure search UI reacts and shows search state.
      await expect(
        leftPanel.searchControls.clearSearchButton,
        'Clear search button should be visible after entering search text',
      ).toBeVisible();
      await expect(
        leftPanel.searchControls.notesDisplayedCounter,
        'Notes counter should be visible in search mode',
      ).toContainText('Notes displayed:');

      // Validate query-only results: expected notes are present and unrelated one is absent.
      await expect(
        leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root,
        `Note "${noteMatchedWithTag.title}" should be visible in short-query results`,
      ).toBeVisible();
      await expect(
        leftPanel.getNoteCardByTitle(noteMatchedWithoutTag.title).root,
        `Note "${noteMatchedWithoutTag.title}" should be visible in short-query results`,
      ).toBeVisible();
      await expect(
        leftPanel.getNoteCardByTitle(noteNotMatchedButWithTag.title).root,
        `Note "${noteNotMatchedButWithTag.title}" should not be visible in short-query results`,
      ).toHaveCount(0);
    });

    await test.step('apply a tag filter', async () => {
      // Apply tag filter from the matched note card.
      await leftPanel
        .getNoteCardByTitle(noteMatchedWithTag.title)
        .getTagChipByText(filterTag)
        .click();

      // Confirm tag-filtered mode is active and narrowed to one note.
      await expect(
        leftPanel.searchControls.clearTagsButton,
        'Clear tags button should be visible after applying tag filter',
      ).toBeVisible();
      await expect(
        leftPanel.searchControls.searchInput,
        'Search input placeholder should reflect the active tag filter',
      ).toHaveAttribute('placeholder', `Search in "${filterTag}" notes...`);
      await expect(
        leftPanel.searchControls.notesDisplayedCounter,
        'Notes counter should show one filtered note after applying tag filter',
      ).toHaveText('Notes displayed: 1 out of 1');

      // Ensure only the expected note remains in query + tag filter mode.
      await expect(
        leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root,
        `Tagged note "${noteMatchedWithTag.title}" should remain visible after applying tag filter`,
      ).toBeVisible();
      await expect(
        leftPanel.getNoteCardByTitle(noteMatchedWithoutTag.title).root,
        `Untagged note "${noteMatchedWithoutTag.title}" should be excluded by tag filter`,
      ).toHaveCount(0);
      await expect(
        leftPanel.getNoteCardByTitle(noteNotMatchedButWithTag.title).root,
        `Non-matching note "${noteNotMatchedButWithTag.title}" should stay excluded when text query is active`,
      ).toHaveCount(0);
    });

    await test.step('clear text search', async () => {
      // Clear only text search and keep tag filter to validate tag-only narrowing.
      await leftPanel.searchControls.clearSearchButton.click();
      await expect(
        leftPanel.searchControls.notesDisplayedCounter,
        'Notes counter should show both notes with the selected tag after clearing text search',
      ).toHaveText('Notes displayed: 2 out of 2');

      // Ensure tag-only mode keeps tagged notes and excludes notes without the tag.
      await expect(
        leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root,
        `Note "${noteMatchedWithTag.title}" should remain visible in tag-only mode`,
      ).toBeVisible();
      await expect(
        leftPanel.getNoteCardByTitle(noteNotMatchedButWithTag.title).root,
        `Note "${noteNotMatchedButWithTag.title}" should be visible in tag-only mode`,
      ).toBeVisible();
      await expect(
        leftPanel.getNoteCardByTitle(noteMatchedWithoutTag.title).root,
        `Note "${noteMatchedWithoutTag.title}" should remain hidden because it does not have tag "${filterTag}"`,
      ).toHaveCount(0);
    });

    await test.step('open a note and verify its content', async () => {
      // Open the primary matched note and verify its body content in read mode.
      await leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root.click();
      await expect(
        readView.readingHeading,
        'Reading view heading should be visible after opening a search result note',
      ).toBeVisible();
      await expect(
        readView.noteText,
        'Reading view should show content of the opened matching note',
      ).toContainText(noteMatchedWithTagBodyText);
    });
  });

  test('long query search shows full-text results and supports tag filtering', async ({
    leftPanel,
    readView,
  }) => {
    await test.step('perform full-text search', async () => {
      // Start with long-query mode (> 3 characters).
      await leftPanel.searchControls.searchInput.fill(fullTextQuery);

      // Ensure full-text result block is visible and includes cheap signal checks.
      await expect(
        leftPanel.fullTextSearchResults.foundNotesText,
        'Full-text results should report two found notes before tag filtering',
      ).toHaveText('Found: 2 notes');
      await expect(
        leftPanel.fullTextSearchResults.searchDurationText,
        'Search duration should be shown in milliseconds',
      ).toHaveText(/^\d+ms$/);
      await expect(
        leftPanel.fullTextSearchResults.searchModeLabel,
        'Full-text search mode label should be visible for long query',
      ).toBeVisible();
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
      await leftPanel.fullTextSearchResults
        .getTagChipByTitle(noteMatchedWithTag.title, filterTag)
        .click();

      // Confirm both filters are active and only one expected result remains.
      await expect(
        leftPanel.searchControls.clearTagsButton,
        'Clear tags button should be visible after applying full-text tag filter',
      ).toBeVisible();
      await expect(
        leftPanel.searchControls.searchInput,
        'Search input placeholder should reflect active full-text tag filter',
      ).toHaveAttribute('placeholder', `Search in "${filterTag}" notes...`);
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

    await test.step('open a note and verify its content', async () => {
      // Open the remaining result and verify its body content in read mode.
      await leftPanel.fullTextSearchResults.getResultCardByTitle(noteMatchedWithTag.title).click();
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
