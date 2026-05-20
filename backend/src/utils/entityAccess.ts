import { EntityType, Role } from '@prisma/client'
import { AppError } from './AppError'

export type Ownership = { type: EntityType; userId: number | null }

export function assertCanMutate(
  item: Ownership,
  userId: number,
  userRole: Role,
  entityName: string,
  action: 'পরিবর্তন' | 'মুছে ফেলা',
) {
  if (item.type === EntityType.SYSTEM && userRole !== Role.ADMIN) {
    throw new AppError(`SYSTEM ${entityName} ${action} করা যাবে না`, 403)
  }
  if (item.type === EntityType.USER && userRole !== Role.ADMIN && item.userId !== userId) {
    throw new AppError(`এই ${entityName} ${action}ের অনুমতি নেই`, 403)
  }
}

export function accessFilter(userId: number, userRole: Role) {
  return userRole === Role.ADMIN
    ? {}
    : { OR: [{ type: EntityType.SYSTEM }, { userId }] }
}
