import prisma from '../../prisma'
import { AppError } from '../../utils/AppError'
import { convert } from '../../utils/unitConverter'

type UnitOwnership = { type: string; userId: number | null }

function assertUserOwnsUnit(
  unit: UnitOwnership,
  userId: number,
  userRole: string,
  action: 'পরিবর্তন' | 'মুছে ফেলা',
) {
  if (unit.type === 'SYSTEM') {
    if (userRole !== 'ADMIN') throw new AppError(`SYSTEM একক ${action} করা যাবে না`, 403)
    return
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

  // Check uniqueness within the scope visible to this user:
  // - SYSTEM creation: no other SYSTEM unit with the same name
  // - USER creation: no SYSTEM unit and no own USER unit with the same name
  const conflict = await prisma.unit.findFirst({
    where: {
      name: { equals: trimmedName, mode: 'insensitive' },
      ...(isSystem
        ? { type: 'SYSTEM' }
        : { OR: [{ type: 'SYSTEM' }, { userId }] }
      ),
    },
  })
  if (conflict) throw new AppError('এই নামে একটি একক ইতিমধ্যে আছে', 409)

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
  userRole: string,
  unitId: number,
  data: { name?: string; groupKey?: string | null; baseRatio?: number | null },
) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) throw new AppError('একক পাওয়া যায়নি', 404)
  assertUserOwnsUnit(unit, userId, userRole, 'পরিবর্তন')

  if (data.name !== undefined) {
    const trimmedName = data.name.trim()
    if (!trimmedName) throw new AppError('এককের নাম দিন', 400)

    // Admin editing SYSTEM: check only against other SYSTEM units
    // User editing own USER unit: check against SYSTEM + own USER units
    const conflict = await prisma.unit.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        ...(unit.type === 'SYSTEM'
          ? { type: 'SYSTEM' }
          : { OR: [{ type: 'SYSTEM' }, { userId }] }
        ),
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

export async function deleteUnit(userId: number, userRole: string, unitId: number) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } })
  if (!unit) throw new AppError('একক পাওয়া যায়নি', 404)
  assertUserOwnsUnit(unit, userId, userRole, 'মুছে ফেলা')

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
