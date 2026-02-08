import { expect, test } from '../test-elements/fixtures/api.fixture';

test('notes api smoke', async ({ notesApi }) => {
  const title = `API note ${Date.now()}`;
  const description = `<p>API body ${Date.now()}</p>`;

  const created = await notesApi.createNote({ title, description });
  expect(created.status).toBe(200);

  const fetched = await notesApi.getNotes({ id: created.data.note.id });
  expect(fetched.status).toBe(200);
  if ('note' in fetched.data) {
    expect(fetched.data.note.title).toBe(title);
  }

  const deleted = await notesApi.deleteNote(created.data.note.id);
  expect(deleted.status).toBe(200);
});
