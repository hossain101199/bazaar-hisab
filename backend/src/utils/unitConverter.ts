export type UnitLike = { groupKey: string | null; baseRatio: number | null };

export function convert(value: number, fromUnit: UnitLike, toUnit: UnitLike): number {
  if (!fromUnit.groupKey || fromUnit.groupKey !== toUnit.groupKey) {
    throw new Error('রূপান্তর সম্ভব না');
  }
  if (!fromUnit.baseRatio || fromUnit.baseRatio === 0) {
    throw new Error('from এককের baseRatio অবৈধ');
  }
  if (!toUnit.baseRatio || toUnit.baseRatio === 0) {
    throw new Error('to এককের baseRatio অবৈধ');
  }
  const inBase = value * fromUnit.baseRatio;
  return inBase / toUnit.baseRatio;
}
