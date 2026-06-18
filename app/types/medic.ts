// Placeholder for medic-related types. The original definition is not part
// of this library's source tree; consumers that need richer shapes can
// augment or replace this declaration.
export interface Illness {
  id: number | string;
  name: string;
  [key: string]: unknown;
}
