export function validateDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function validatePositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function validateProductName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 200;
}

export function validateUnitName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}

export function validateQuantity(quantity: any): boolean {
  const num = Number(quantity);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function validatePrice(price: any, maxPrice = 10000000): boolean {
  const num = Number(price);
  return !isNaN(num) && num > 0 && num <= maxPrice && isFinite(num);
}
