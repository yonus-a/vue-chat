// Placeholder for the invoice type. The original definition is not part of
// this library's source tree; consumers that need a richer shape can augment
// or replace this declaration.
export interface Invoice {
  id: number | string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}
