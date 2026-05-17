export function sanitizeSearch(search: string): string {
  return search.trim().substring(0, 100);
}
