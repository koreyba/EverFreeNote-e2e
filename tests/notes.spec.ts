import { expect, test } from '@playwright/test';
import { EditView } from '../test-elements/views/edit.view';
import { LeftPanel } from '../test-elements/views/left-panel.view';
import { ReadView } from '../test-elements/views/read.view';


test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('create, read, and delete a note', async ({ page }) => {
  const timestamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const noteTitleText = `Created by Playwright ${timestamp}`;
  const noteBodyText = `Text body ${timestamp}`;
 
  const leftPanel = new LeftPanel(page);
  const editView = new EditView(page);
  const readView = new ReadView(page);

  await leftPanel.newNoteButton.click();
  await editView.noteTitleInput.click();
  await editView.noteTitleInput.fill(noteTitleText);
  await editView.noteContentArea.click();
  await editView.tiptapEditor.fill(noteBodyText);

  await expect(editView.tiptapEditor).toContainText(noteBodyText);

  await editView.saveButton.click();
  

  await expect(editView.readButton).toBeEnabled();

  await editView.readButton.click();

  await expect(readView.readingHeading).toBeVisible();
  await expect(readView.noteText).toContainText(noteBodyText);

  const noteCard = leftPanel.getNoteCardNumber(0);

  await expect(noteCard.titleHeading).toHaveText(noteTitleText);
  await expect(noteCard.bodyParagraph).toHaveText(noteBodyText);

  const date = getFormattedDate();

  await expect(noteCard.dateParagraph).toHaveText(date);

  await readView.deleteButton.click();
  await expect(readView.deleteDialog.dialog).toBeVisible();
  
  await readView.deleteDialog.confirmButton.click();
  await expect(readView.emptyStateText).toBeVisible();

  const deletedNote = leftPanel.getNoteCardByTitle(noteTitleText);
  await expect(deletedNote.root, 'Deleted note was found when not expected').toHaveCount(0);
});

function getFormattedDate () {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const formatted = `${dd}.${mm}.${yyyy}`;
  return formatted;
}
