/** Returns the parsed integer if it is a positive finite integer, otherwise null. */
export function parsePositiveInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}
