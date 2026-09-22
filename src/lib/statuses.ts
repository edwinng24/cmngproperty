/** Shared between the server queries and the admin UI, so no "server-only". */
export const STATUSES = [
  "new",
  "reviewing",
  "approved",
  "declined",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof STATUSES)[number];
