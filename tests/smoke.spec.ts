import { expect, test } from '@playwright/test';
import { loginWithPersistentTestUser } from '../test-elements/flows/auth.flow';
import { EditView } from '../test-elements/views/edit.view';
import { LeftPanel } from '../test-elements/views/left-panel.view';
import { ReadView } from '../test-elements/views/read.view';

test('create, read, and delete a note', async ({ page }) => {
  const timestamp = Date.now();
  const noteTitleText = `Created by Playwright ${timestamp}`;
  const noteBodyText = `Text body ${timestamp}`;

  await loginWithPersistentTestUser(page);

  const leftPanel = new LeftPanel(page);
  const editView = new EditView(page);
  const readView = new ReadView(page);

  await leftPanel.newNoteButton.click();
  await editView.noteTitleInput.click();
  await editView.noteTitleInput.fill(noteTitleText);
  await editView.noteContentArea.click();
  await editView.tiptapEditor.fill(noteBodyText);
  await editView.saveButton.click();
  await expect(editView.readButton).toBeEnabled();
  await editView.readButton.click();

  await expect(readView.readingHeading).toBeVisible();
  await expect(readView.noteText).toContainText(noteBodyText);

  const noteCard = leftPanel.getNoteCardNumber(0);
  await expect(noteCard.titleHeading).toHaveText(noteTitleText);
  await expect(noteCard.bodyParagraph).toHaveText(noteBodyText);

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const formatted = `${dd}.${mm}.${yyyy}`;


  await expect(noteCard.dateParagraph).toHaveText(formatted);

  await readView.deleteButton.click();
  await readView.deleteButton.click();
  await expect(readView.emptyStateText).toBeVisible();
});
