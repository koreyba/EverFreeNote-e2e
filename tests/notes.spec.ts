import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { deleteNotesWithGivenTitleIfFound } from '../test-api/flows/notes.api.flow';
import { A11yReport } from '../test-utils/a11y';

let createdNoteTitle = '';
let shouldCleanupCreatedNote = true;

test.describe('notes crud', () => {
  test.beforeEach(async ({ page, analyzeA11y }, testInfo) => {
    shouldCleanupCreatedNote = true;
    createdNoteTitle = '';
    await page.goto('/');

    const a11y = await analyzeA11y();
    if (a11y.hasViolations()) {
      await testInfo.attach('a11y-report-landing.md', {
        body: a11y.format(),
        contentType: 'text/markdown',
      });
    }
    expect(
      a11y.criticalViolations.length,
      'Landing page should have 0 critical a11y violations',
    ).toBe(0);
  });

  test.afterEach(async ({ notesApi }) => {
    if (!shouldCleanupCreatedNote || !createdNoteTitle) {
      return;
    }

    try {
      await deleteNotesWithGivenTitleIfFound(notesApi, createdNoteTitle);
    } catch {
      // Best-effort cleanup to keep shared environment stable.
    }
  });

  test('create, read, and delete a note', async ({
    leftPanel,
    editView,
    readView,
    deleteDialog,
    analyzeA11y,
  }, testInfo) => {
    const timestamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    createdNoteTitle = `Created by Playwright ${timestamp}`;
    const noteBodyText = `Text body ${timestamp}`;
    const a11yScans: { context: string; report: A11yReport }[] = [];

    await test.step('fill in new note details', async () => {
      await leftPanel.clickNewNote();
      await editView.fillNote(createdNoteTitle, noteBodyText);

      await expect(
        editView.tiptapEditor,
        'Editor should contain entered note body text before save',
      ).toContainText(noteBodyText);
    });

    await test.step('Accessibility scan: Editor View', async () => {
      const a11y = await analyzeA11y();
      if (a11y.hasViolations()) {
        await testInfo.attach('a11y-report-edit.md', {
          body: a11y.format(),
          contentType: 'text/markdown',
        });
      }
      a11yScans.push({ context: 'Editor View', report: a11y });
    });

    await test.step('save the note', async () => {
      await editView.save();
    });

    await test.step('read the created note', async () => {
      await expect(
        editView.readButton,
        'Read button should be enabled after saving the note',
      ).toBeEnabled();

      await editView.switchToRead();

      await expect(
        readView.readingHeading,
        'Reading view heading should be visible after switching to read mode',
      ).toBeVisible();
      await expect(
        readView.noteText,
        'Reading view should display the saved note body text',
      ).toContainText(noteBodyText);

      const noteCard = leftPanel.getNoteCardNumber(0);

      await expect(
        noteCard.titleHeading,
        'Top note card title should match the created note title',
      ).toHaveText(createdNoteTitle);
      await expect(
        noteCard.bodyParagraph,
        'Top note card body should match the created note body text',
      ).toHaveText(noteBodyText);

      const date = getFormattedDate();

      await expect(
        noteCard.dateParagraph,
        "Top note card date should match today's date",
      ).toHaveText(date);
    });

    await test.step('Accessibility scan: Read View', async () => {
      const a11yRead = await analyzeA11y();
      if (a11yRead.hasViolations()) {
        await testInfo.attach('a11y-report-read.md', {
          body: a11yRead.format(),
          contentType: 'text/markdown',
        });
      }
      a11yScans.push({ context: 'Read View', report: a11yRead });
    });

    await test.step('open delete dialog', async () => {
      await readView.deleteNote();
      await expect(
        deleteDialog.dialog,
        'Delete confirmation dialog should be visible after clicking delete',
      ).toBeVisible();
    });

    await test.step('Accessibility scan: Delete Dialog', async () => {
      const a11yDelete = await analyzeA11y();
      if (a11yDelete.hasViolations()) {
        await testInfo.attach('a11y-report-delete.md', {
          body: a11yDelete.format(),
          contentType: 'text/markdown',
        });
      }
      a11yScans.push({ context: 'Delete Dialog', report: a11yDelete });
    });

    await test.step('confirm note deletion', async () => {
      await deleteDialog.confirm();
      await expect(
        readView.emptyStateText,
        'Empty state text should be visible after deleting the note',
      ).toBeVisible();

      const deletedNote = leftPanel.getNoteCardByTitle(createdNoteTitle);
      await expect(deletedNote.root, 'Deleted note was found when not expected').toHaveCount(0);
      shouldCleanupCreatedNote = false;
    });

    await test.step('Verify accessibility compliance', async () => {
      for (const scan of a11yScans) {
        if (scan.report.hasViolations()) {
          await testInfo.attach(
            `a11y-report-${scan.context.toLowerCase().replace(/\s+/g, '-')}.md`,
            {
              body: scan.report.format(),
              contentType: 'text/markdown',
            },
          );
        }

        expect(
          scan.report.hasViolations(),
          `Accessibility scan on "${scan.context}" should have no violations`,
        ).toBe(false);
      }
    });
  });
});

function getFormattedDate() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const formatted = `${dd}.${mm}.${yyyy}`;
  return formatted;
}
