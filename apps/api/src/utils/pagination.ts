/**
 * Cursor-based pagination utilities.
 *
 * Cursors are base64-encoded JSON objects containing the last item's
 * sort key (e.g. { id: 123 } or { added_at: "2024-...", id: 45 }).
 */

export interface CursorData {
  [key: string]: string | number;
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    return JSON.parse(decoded) as CursorData;
  } catch {
    return null;
  }
}

export interface PaginatedResponse<T> {
  results: T[];
  totalDocs: number;
  previous: string | null;
  next: string | null;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginatedResponse<T>(
  items: T[],
  totalDocs: number,
  limit: number,
  getCursorData: (item: T) => CursorData,
  hasPrevious: boolean
): PaginatedResponse<T> {
  const hasNext = items.length > limit;

  // If we fetched limit+1 items, trim the extra one
  const results = hasNext ? items.slice(0, limit) : items;

  const previous = hasPrevious && results.length > 0
    ? encodeCursor(getCursorData(results[0]))
    : null;

  const next = hasNext && results.length > 0
    ? encodeCursor(getCursorData(results[results.length - 1]))
    : null;

  return {
    results,
    totalDocs,
    previous,
    next,
    hasNext,
    hasPrev: hasPrevious,
  };
}
