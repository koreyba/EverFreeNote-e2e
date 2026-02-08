/** A note entity as returned by the API. */
export type Note = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

/** Request body for `POST /create-note`. All fields are optional. */
export type CreateNotePayload = {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
};

/** Query parameters for `GET /get-notes`. */
export type GetNotesQuery = {
  id?: string;
  title?: string;
  limit?: number;
};
