import { test as base } from '@playwright/test';
import { createAuthedContext } from '../../test-api/auth';
import { NotesApi } from '../../test-api/notes.api';

// Extend Playwright's base test with API-level fixtures.
export const test = base.extend<{ notesApi: NotesApi }>({
  notesApi: async ({}, use) => {
    // Create an authenticated API request context for this test run.
    const apiContext = await createAuthedContext();
    // Build a Notes API helper on top of the authenticated context.
    const notes = new NotesApi(apiContext, (options) => createAuthedContext(options));
    // Expose the fixture to the test body and dependent fixtures.
    await use(notes);
    // Teardown: dispose API resources after the test is finished.
    await notes.dispose();
  },
});

// Re-export expect so tests can import from this fixture module only.
export { expect } from '@playwright/test';
