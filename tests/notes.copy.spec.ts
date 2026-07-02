import { Page } from '@playwright/test';
import { expect, test } from '../test-elements/fixtures/page-objects.fixture';
import { deleteNotesWithGivenTitleIfFound } from '../test-api/flows/notes.api.flow';

const isMac = process.platform === 'darwin';
const modifier = isMac ? 'Meta' : 'Control';

test.describe('notes copy and paste', () => {
  let createdNotes: string[] = [];

  test.beforeEach(async ({ context, page, browserName }) => {
    // Grant clipboard read/write permissions for Chromium/Firefox.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    // WebKit-only workaround: mock clipboard to intercept copies since WebKit sandboxes E2E clipboard reads.
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (browserName === 'webkit') {
      await setupWebKitClipboardMock(page);
    }
  });

  test.afterEach(async ({ notesApi }) => {
    // Clean up all notes created during this test run.
    for (const title of createdNotes) {
      try {
        await deleteNotesWithGivenTitleIfFound(notesApi, title);
      } catch {
        // Best-effort cleanup
      }
    }
    createdNotes = [];
  });

  test('copy note via UI button and paste into a new note preserves all formatting', async ({
    notesApi,
    leftPanel,
    editView,
    readView,
    page,
    browserName,
  }) => {
    const timestamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const originalTitle = `Original Copy Test Note ${timestamp}`;
    const pastedTitle = `Pasted Copy Test Note ${timestamp}`;

    // Rich HTML formatting combining header, non-standard size text,
    // custom font families, text alignment, and a numbered list.
    const richHtmlDescription =
      '<h1>Header formatting</h1>' +
      '<p style="text-align: center;"><span style="font-family: serif; font-size: 18px;">Serif text, size 18px, centered alignment</span></p>' +
      '<p></p>' +
      '<p style="text-align: right;"><span style="font-family: monospace;">Monospace text, standard size, right alignment</span></p>' +
      '<ol><li><p>First element of numbered list</p></li><li><p>Second element of numbered list</p></li></ol>' +
      '<p></p>';

    // 1. Create a note with rich formatting via the API.
    await test.step('Create a note with rich formatting via API', async () => {
      const created = await notesApi.createNote({
        title: originalTitle,
        description: richHtmlDescription,
      });
      expect(created.status, 'API note creation should succeed with 200').toBe(200);
      createdNotes.push(originalTitle);
    });

    // 2. Open the note, enter edit mode, and copy its content using the "Copy note" button.
    await test.step('Open note, enter edit mode, and click Copy note button', async () => {
      // Reload page to fetch the newly created note into the list
      await page.goto('/');

      const noteCard = leftPanel.getNoteCardByTitle(originalTitle);
      await expect(
        noteCard.root,
        'The created note card should be visible in the notes list',
      ).toBeVisible();
      await noteCard.open();

      // Wait until the note's text content is fully loaded and rendered
      await expect(
        readView.noteText,
        'The note content should load and display formatted header',
      ).toContainText('Header formatting');

      await expect(
        editView.copyButton,
        'The Copy note button should be visible in the EditView',
      ).toBeVisible();
      await expect(
        editView.copyButton,
        'The Copy note button should be enabled once content is loaded',
      ).toBeEnabled();
      await editView.copyButton.click();
    });

    // 3. Create a new note, input its title, focus the editor body, paste the copied content, and save.
    await test.step('Create a new note and paste copied content into it', async () => {
      await leftPanel.clickNewNote();
      createdNotes.push(pastedTitle);

      await expect(
        editView.noteTitleInput,
        'The Note title input field should be visible',
      ).toBeVisible();

      // Wait for the editor to transition and clear the title input
      await expect(editView.noteTitleInput, 'Wait for default draft title to clear').toHaveValue(
        '',
      );

      await editView.noteTitleInput.click();
      await editView.noteTitleInput.fill(pastedTitle);

      await editView.noteContentArea.click();
      await editView.tiptapEditor.focus();

      await pasteContent(page, browserName);

      // Intercept and wait for the database save REST request to complete successfully
      const saveResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/notes') &&
          ['POST', 'PATCH', 'PUT'].includes(response.request().method()) &&
          response.status() >= 200 &&
          response.status() < 300,
        { timeout: 10000 },
      );
      await editView.save();
      await saveResponsePromise;
    });

    // 4. Fetch both notes via API and assert that their HTML descriptions are identical.
    await test.step('Verify pasted note description matches original note description via API', async () => {
      const originalRes = await notesApi.getNotes({ title: originalTitle });
      const pastedRes = await notesApi.getNotes({ title: pastedTitle });

      expect(originalRes.status, 'API request to get original note should return 200').toBe(200);
      expect(pastedRes.status, 'API request to get pasted note should return 200').toBe(200);

      const originalNote = originalRes.data.notes.find((n) => n.title === originalTitle);
      const pastedNote = pastedRes.data.notes.find((n) => n.title === pastedTitle);

      expect(originalNote, 'Original note should be found in the API response').toBeDefined();
      expect(pastedNote, 'Pasted note should be found in the API response').toBeDefined();

      expect(
        pastedNote!.description,
        'Pasted note description HTML should be identical to original',
      ).toBe(originalNote!.description);
    });
  });
});

/**
 * WebKit clipboard mock setup to capture copy actions in E2E sandbox.
 */
async function setupWebKitClipboardMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let mockHtml = '';
    let mockText = '';

    if (navigator.clipboard) {
      navigator.clipboard.write = async (items) => {
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            mockHtml = await blob.text();
          }
          if (item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            mockText = await blob.text();
          }
        }
        (
          globalThis as typeof globalThis & {
            __mockClipboardHtml?: string;
            __mockClipboardText?: string;
          }
        ).__mockClipboardHtml = mockHtml;
        (
          globalThis as typeof globalThis & {
            __mockClipboardHtml?: string;
            __mockClipboardText?: string;
          }
        ).__mockClipboardText = mockText;
      };

      navigator.clipboard.writeText = async (text) => {
        mockText = text;
        (
          globalThis as typeof globalThis & {
            __mockClipboardHtml?: string;
            __mockClipboardText?: string;
          }
        ).__mockClipboardText = text;
      };
    }
  });
}

/**
 * Helper to paste content into the note editor.
 * Uses native shortcut for Chromium/Firefox, and synthetic paste event for WebKit.
 */
async function pasteContent(page: Page, browserName: string): Promise<void> {
  // eslint-disable-next-line playwright/no-conditional-in-test
  if (browserName === 'webkit') {
    await page.evaluate(() => {
      const el = document.querySelector('.tiptap') as HTMLElement;
      if (el) {
        const dataTransfer = new DataTransfer();
        const html =
          (
            globalThis as typeof globalThis & {
              __mockClipboardHtml?: string;
              __mockClipboardText?: string;
            }
          ).__mockClipboardHtml || '';
        const text =
          (
            globalThis as typeof globalThis & {
              __mockClipboardHtml?: string;
              __mockClipboardText?: string;
            }
          ).__mockClipboardText || '';

        dataTransfer.setData('text/html', html);
        dataTransfer.setData('text/plain', text);

        const event = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(event);
      }
    });
  } else {
    await page.keyboard.press(`${modifier}+a`);
    await page.keyboard.press(`${modifier}+v`);
  }
}
