import prisma from '../../prisma'
import { AppError } from '../../utils/AppError'
import { convert } from '../../utils/unitConverter'

type UnitOwnership = { type: string; userId: number | null }

function assertUserOwnsUnit(
  unit: UnitOwnership,
  userId: number,
  action: 'পরিবর্তন' | 'মুছে ফেলা',
) {
  if (unit.type === 'SYSTEM') {
    throw new AppError(`SYSTEM একক ${action} করা যাবে না`, 403)
  }
  if (unit.userId !== userId) {
    throw new AppError(`এই একক ${action}ের অনুমতি নেই`, 403)
  }
}

export async function listUnits(userId: number) {
  return prisma.unit.findMany({
    where: { OR: [{ type: 'SYSTEM' }, { type: 'USER', userId }] },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
}

export async function createUnit(
  userId: number,
  userRole: string,
  data: { name: string; type?: string; groupKey?: string | null; baseRatio?: number | null },
) {
  const isSystem = data.type === 'SYSTEM'
  if (isSystem && userRole !== 'ADMIN') {
    throw new AppError('শুধুমাত্র Admin SYSTEM একক তৈরি করতে পারবেন', 403)
  }

  const trimmedName = data.name.trim()
  if (!trimmedName) throw new AppError('এককের নাম দিন', 400)

  return prisma.unit.create({
    data: {
      name: trimmedName,
      type: isSystem ? 'SYSTEM' : 'USER',
      groupKey: data.groupKey ?? null,
      baseRatio: data.baseRatio ?? null,
      userId: isSystem ? null : userId,
    },
  })
}

export async function updateUnit(
  userId: number,
  unitId: number,
  data: { name?: string; groupKey?: string | null; baseRatio?: number | null },
) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) throw new AppError('একক পাওয়া যায়নি', 404)
  assertUserOwnsUnit(unit, userId, 'পরিবর্তন')

  if (data.name !== undefined && !data.name.trim()) {
    throw new AppError('এককের নাম দিন', 400)
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

export async function deleteUnit(userId: number, unitId: number) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) throw new AppError('একক পাওয়া যায়নি', 404)
  assertUserOwnsUnit(unit, userId, 'মুছে ফেলা')

  const usedByProduct = await prisma.product.findFirst({ where: { unitId } })
  if (usedByProduct) {
    throw new AppError('এই এককটি পণ্যে ব্যবহৃত হয়েছে, মুছে ফেলা যাবে না', 409)
  }

  await prisma.unit.delete({ where: { id: unitId } })
}

export async function convertUnits(fromId: number, toId: number, value: number) {
  const [fromUnit, toUnit] = await Promise.all([
    prisma.unit.findUnique({ where: { id: fromId } }),
    prisma.unit.findUnique({ where: { id: toId } }),
  ])
  if (!fromUnit) throw new AppError('from একক পাওয়া যায়নি', 404)
  if (!toUnit) throw new AppError('to একক পাওয়া যায়নি', 404)

  const result = convert(value, fromUnit, toUnit)
  return { from: fromUnit.name, to: toUnit.name, value, result }
}
