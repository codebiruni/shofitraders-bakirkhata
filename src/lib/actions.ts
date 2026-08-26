/**
 * Shared action result type for server actions.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
