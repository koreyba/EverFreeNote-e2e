import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import type { Note } from '../test-api/notes.types';

const SHORT_QUERY = 'qz';

let createdNoteIds: string[] = [];
let filterTag = '';
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
    noteMatchedWithTagBodyText = `keep body ${runId}`;
    const noteMatchedWithoutTagBodyText = `drop body ${runId}`;
    const noteNotMatchedButWithTagBodyText = `hidden body ${runId}`;

    // Seed a note that should match short query and remain after tag filtering.
    const noteCreatedWithTag = await notesApi.createNote({
      title: `${SHORT_QUERY} keep ${runId}`,
      description: `<p>${noteMatchedWithTagBodyText}</p>`,
      tags: [filterTag],
    });
    expect(noteCreatedWithTag.status).toBe(200);
    noteMatchedWithTag = noteCreatedWithTag.data.note;
    createdNoteIds.push(noteMatchedWithTag.id);

    // Seed a note that should match short query but be removed by tag filtering.
    const noteCreatedWithoutTag = await notesApi.createNote({
      title: `${SHORT_QUERY} drop ${runId}`,
      description: `<p>${noteMatchedWithoutTagBodyText}</p>`,
      tags: [nonFilterTag],
    });
    expect(noteCreatedWithoutTag.status).toBe(200);
    noteMatchedWithoutTag = noteCreatedWithoutTag.data.note;
    createdNoteIds.push(noteMatchedWithoutTag.id);

    // Seed a note that shares the filter tag but should not match short query.
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
    // Start with short-query search mode (<= 3 characters).
    await leftPanel.searchControls.searchInput.fill(SHORT_QUERY);

    // Ensure search UI reacts and shows search state.
    await expect(leftPanel.searchControls.clearSearchButton).toBeVisible();
    await expect(leftPanel.searchControls.notesDisplayedCounter).toContainText('Notes displayed:');

    // Validate query-only results: expected notes are present and unrelated one is absent.
    await expect(leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root).toBeVisible();
    await expect(leftPanel.getNoteCardByTitle(noteMatchedWithoutTag.title).root).toBeVisible();
    await expect(leftPanel.getNoteCardByTitle(noteNotMatchedButWithTag.title).root).toHaveCount(0);

    // Apply tag filter from the matched note card.
    await leftPanel
      .getNoteCardByTitle(noteMatchedWithTag.title)
      .getTagChipByText(filterTag)
      .click();

    // Confirm tag-filtered mode is active and narrowed to one note.
    await expect(leftPanel.searchControls.clearTagsButton).toBeVisible();
    await expect(leftPanel.searchControls.searchInput).toHaveAttribute(
      'placeholder',
      `Search in "${filterTag}" notes...`,
    );
    await expect(leftPanel.searchControls.notesDisplayedCounter).toHaveText(
      'Notes displayed: 1 out of 1',
    );

    //Check only expected notes are found
    await expect(leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root).toBeVisible();
    await expect(leftPanel.getNoteCardByTitle(noteMatchedWithoutTag.title).root).toHaveCount(0);
    await expect(leftPanel.getNoteCardByTitle(noteNotMatchedButWithTag.title).root).toHaveCount(0);

    // Clear only text search and keep tag filter to validate tag-only narrowing.
    await leftPanel.searchControls.clearSearchButton.click();

    await expect(leftPanel.searchControls.notesDisplayedCounter).toHaveText(
      'Notes displayed: 2 out of 2',
    );

    //Check only expected notes are found
    await expect(leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root).toBeVisible();
    await expect(leftPanel.getNoteCardByTitle(noteNotMatchedButWithTag.title).root).toBeVisible();
    await expect(leftPanel.getNoteCardByTitle(noteMatchedWithoutTag.title).root).toHaveCount(0);

    // Open the primary matched note and verify its body content in read mode.
    await leftPanel.getNoteCardByTitle(noteMatchedWithTag.title).root.click();
    await expect(readView.readingHeading).toBeVisible();
    await expect(readView.noteText).toContainText(noteMatchedWithTagBodyText);
  });
});
