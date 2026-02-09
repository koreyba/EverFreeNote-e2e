import type { APIRequestContext } from '@playwright/test';
import type { CreateNotePayload, GetNotesQuery, Note } from './notes.types';

/**
 * Generic wrapper for API responses.
 * @property status - HTTP status code (e.g. 200, 400, 404).
 * @property data - Parsed JSON body of the response.
 */
export type ApiResponse<T> = {
  status: number;
  data: T;
};

/**
 * Typed client for the Notes Edge Functions API.
 * Wraps Playwright's {@link APIRequestContext} and returns parsed, typed responses.
 *
 * @example
 * ```ts
 * const api = new NotesApi(apiContext);
 * const { status, data } = await api.createNote({ title: 'Hello' });
 * ```
 */
export class NotesApi {
  constructor(private readonly api: APIRequestContext) {}

  /** POST `create-note` - creates a new note. */
  async createNote(payload: CreateNotePayload = {}) {
    const res = await this.api.post('create-note', { data: payload });
    return this.parse<{ note: Note }>(res);
  }

  /**
   * GET `get-notes` - fetches notes by query params.
   * Always returns normalized payload shape: `{ notes: Note[] }`.
   */
  async getNotes(query: GetNotesQuery = {}): Promise<ApiResponse<{ notes: Note[] }>> {
    const res = await this.api.get('get-notes', { params: query });
    const parsed = await this.parse<{ note: Note } | { notes: Note[] }>(res);
    const notes = 'notes' in parsed.data ? parsed.data.notes : [parsed.data.note];

    return {
      status: parsed.status,
      data: { notes },
    };
  }

  /** POST `delete-note` - deletes a note by id. */
  async deleteNote(id: string) {
    const res = await this.api.post('delete-note', { data: { id } });
    return this.parse<{ id: string }>(res);
  }

  /** Disposes the underlying Playwright request context. Call in teardown. */
  async dispose() {
    await this.api.dispose();
  }

  /** Parses the raw Playwright response into `{ status, data }`. */
  private async parse<T>(
    res: Awaited<ReturnType<APIRequestContext['get']>>,
  ): Promise<ApiResponse<T>> {
    return {
      status: res.status(),
      data: (await res.json()) as T,
    };
  }
}
