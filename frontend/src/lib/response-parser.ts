export function validateUser(user: unknown): boolean {
  return (
    typeof user === "object" &&
    user !== null &&
    typeof (user as Record<string, unknown>).id === "number" &&
    typeof (user as Record<string, unknown>).name === "string" &&
    typeof (user as Record<string, unknown>).email === "string" &&
    typeof (user as Record<string, unknown>).role === "string" &&
    typeof (user as Record<string, unknown>).createdAt === "string"
  );
}

export function validateProduct(product: unknown): boolean {
  if (typeof product !== "object" || product === null) return false;
  const p = product as Record<string, unknown>;
  return (
    typeof p.id === "number" &&
    typeof p.name === "string" &&
    (p.userId === null || typeof p.userId === "number") &&
    typeof p.unitId === "number" &&
    typeof p.unit === "object" &&
    p.unit !== null &&
    typeof (p.unit as Record<string, unknown>).id === "number" &&
    typeof (p.unit as Record<string, unknown>).name === "string"
  );
}

export function validateUnit(unit: unknown): boolean {
  if (typeof unit !== "object" || unit === null) return false;
  const u = unit as Record<string, unknown>;
  return (
    typeof u.id === "number" &&
    typeof u.name === "string" &&
    typeof u.type === "string"
  );
}

export function validatePurchase(purchase: unknown): boolean {
  if (typeof purchase !== "object" || purchase === null) return false;
  const p = purchase as Record<string, unknown>;
  return (
    typeof p.id === "number" &&
    typeof p.date === "string" &&
    typeof p.totalAmount === "number" &&
    Array.isArray(p.items)
  );
}

export function validateArray<T>(arr: unknown, validator: (item: unknown) => boolean): arr is T[] {
  return Array.isArray(arr) && arr.every(validator);
}

export function validateToken(token: unknown): boolean {
  return typeof token === "string" && token.length > 0;
}
