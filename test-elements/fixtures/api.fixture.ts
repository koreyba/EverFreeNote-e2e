import { test as base } from '@playwright/test';
import { createAuthedContext } from '../../test-api/auth';
import { NotesApi } from '../../test-api/notes.api';

export const test = base.extend<{ notesApi: NotesApi }>({
  notesApi: async ({}, use) => {
    const apiContext = await createAuthedContext();
    const notes = new NotesApi(apiContext);
    await use(notes);
    await notes.dispose();
  },
});

export { expect } from '@playwright/test';
