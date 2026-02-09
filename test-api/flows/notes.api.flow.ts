import type { NotesApi } from '../notes.api';
import type { Note } from '../notes.types';

type CreateNotesViaApiOptions = {
  count: number;
  titlePrefix: string;
  bodyPrefix: string;
  tagsPerNote?: number;
  tagPrefix?: string;
};

export const createNotesViaApi = async (
  notesApi: NotesApi,
  options: CreateNotesViaApiOptions,
): Promise<Note[]> => {
  const { count, titlePrefix, bodyPrefix, tagsPerNote = 0, tagPrefix = 'tag' } = options;
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const notes: Note[] = [];

  for (let index = 1; index <= count; index += 1) {
    const title = `${titlePrefix} ${runId}-${index}`;
    const description = `<p>${bodyPrefix} ${runId}-${index}</p>`;
    const tags =
      tagsPerNote > 0
        ? Array.from({ length: tagsPerNote }, (_, tagIndex) => {
            return `${tagPrefix}-${runId}-${index}-${tagIndex + 1}`;
          })
        : [];
    const created = await notesApi.createNote({ title, description, tags });

    if (created.status !== 200) {
      throw new Error(`Failed to create note. Expected 200, got ${created.status}.`);
    }

    notes.push(created.data.note);
  }

  return notes;
};

export const deleteNotesWithGivenTitleIfFound = async (
  notesApi: NotesApi,
  title: string,
): Promise<string[]> => {
  const fetched = await notesApi.getNotes({ title });

  if (fetched.status !== 200) {
    return [];
  }

  const notes = 'notes' in fetched.data ? fetched.data.notes : [fetched.data.note];
  const matchingNotes = notes.filter((note) => note.title === title);
  const deletedNoteIds: string[] = [];

  for (const note of matchingNotes) {
    const deleted = await notesApi.deleteNote(note.id);
    if (deleted.status === 200) {
      deletedNoteIds.push(note.id);
    }
  }

  return deletedNoteIds;
};
