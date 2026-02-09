import type { NotesApi } from '../notes.api';

type CreateNotesViaApiOptions = {
  count: number;
  titlePrefix: string;
  bodyPrefix: string;
  tagsPerNote?: number;
  tagPrefix?: string;
};

export type CreatedNoteData = {
  id: string;
  title: string;
  description: string;
  tags: string[];
};

type CreatedNotesResult = {
  ids: string[];
  titles: string[];
  notes: CreatedNoteData[];
};

export const createNotesViaApi = async (
  notesApi: NotesApi,
  options: CreateNotesViaApiOptions,
): Promise<CreatedNotesResult> => {
  const { count, titlePrefix, bodyPrefix, tagsPerNote = 0, tagPrefix = 'tag' } = options;
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const ids: string[] = [];
  const titles: string[] = [];
  const notes: CreatedNoteData[] = [];

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

    ids.push(created.data.note.id);
    titles.push(title);
    notes.push({
      id: created.data.note.id,
      title,
      description,
      tags,
    });
  }

  return { ids, titles, notes };
};
