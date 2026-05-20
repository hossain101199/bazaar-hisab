import { EntityType, Role } from '@prisma/client'
import prisma from '../../prisma'
import { AppError } from '../../utils/AppError'
import { accessFilter, assertCanMutate, Ownership } from '../../utils/entityAccess'
import { convert } from '../../utils/unitConverter'

// ─── List ────────────────────────────────────────────────────────────────────

export async function listUnits(userId: number, userRole: Role) {
  return prisma.unit.findMany({
    where: accessFilter(userId, userRole),
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createUnit(
  userId: number,
  userRole: Role,
  data: { name: string; groupKey?: string | null; baseRatio?: number | null },
) {
  const isSystem = userRole === Role.ADMIN

  const trimmedName = data.name.trim()
  if (!trimmedName) throw new AppError('এককের নাম দিন', 400)

  const conflictScope = isSystem
    ? { type: EntityType.SYSTEM }
    : { OR: [{ type: EntityType.SYSTEM }, { userId }] }

  const conflict = await prisma.unit.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' }, ...conflictScope },
  })
  if (conflict) throw new AppError('এই নামে একটি একক ইতিমধ্যে আছে', 409)

  return prisma.unit.create({
    data: {
      name: trimmedName,
      type: isSystem ? EntityType.SYSTEM : EntityType.USER,
      groupKey: data.groupKey ?? null,
      baseRatio: data.baseRatio ?? null,
      userId: isSystem ? null : userId,
    },
  })
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateUnit(
  userId: number,
  userRole: Role,
  unitId: number,
  data: { name?: string; groupKey?: string | null; baseRatio?: number | null },
) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) throw new AppError('একক পাওয়া যায়নি', 404)
  assertCanMutate(unit as Ownership, userId, userRole, 'একক', 'পরিবর্তন')

  if (data.name !== undefined) {
    const trimmedName = data.name.trim()
    if (!trimmedName) throw new AppError('এককের নাম দিন', 400)

    const conflictScope =
      unit.type === EntityType.SYSTEM
        ? { type: EntityType.SYSTEM }
        : { OR: [{ type: EntityType.SYSTEM }, { userId: unit.userId }] }

    const conflict = await prisma.unit.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        ...conflictScope,
        NOT: { id: unitId },
      },
    })
    if (conflict) throw new AppError('এই নামে একটি একক ইতিমধ্যে আছে', 409)
  }

  return prisma.unit.update({
    where: { id: unitId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.groupKey !== undefined && { groupKey: data.groupKey }),
      ...(data.baseRatio !== undefined && { baseRatio: data.baseRatio }),
    },
  })
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteUnit(userId: number, userRole: Role, unitId: number) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) throw new AppError('একক পাওয়া যায়নি', 404)
  assertCanMutate(unit as Ownership, userId, userRole, 'একক', 'মুছে ফেলা')

  const inUse = await prisma.product.findFirst({ where: { unitId } })
  if (inUse) {
    throw new AppError('এই এককটি পণ্যে ব্যবহৃত হয়েছে, মুছে ফেলা যাবে না', 409)
  }

  await prisma.unit.delete({ where: { id: unitId } })
}

// ─── Convert ─────────────────────────────────────────────────────────────────

export async function convertUnits(
  fromId: number,
  toId: number,
  value: number,
  userId: number,
  userRole: Role,
) {
  const filter = accessFilter(userId, userRole)
  const [fromUnit, toUnit] = await Promise.all([
    prisma.unit.findFirst({ where: { id: fromId, ...filter } }),
    prisma.unit.findFirst({ where: { id: toId, ...filter } }),
  ])
  if (!fromUnit) throw new AppError('from একক পাওয়া যায়নি', 404)
  if (!toUnit) throw new AppError('to একক পাওয়া যায়নি', 404)

  const result = convert(value, fromUnit, toUnit)
  return { from: fromUnit.name, to: toUnit.name, value, result }
}
