import { EntityType, Role } from "@prisma/client";
import prisma from "../../prisma";
import { AppError } from "../../utils/AppError";
import { accessFilter, assertCanMutate, Ownership } from "../../utils/entityAccess";

const productSelect = {
  id: true,
  name: true,
  type: true,
  userId: true,
  unitId: true,
  unit: { select: { id: true, name: true } },
} as const;

type ProductRow = {
  id: number;
  name: string;
  type: EntityType;
  userId: number | null;
  unitId: number;
  unit: { id: number; name: string };
};

// Admin sees all units; users see SYSTEM + own USER units.
function unitWhereClause(unitId: number, userId: number, userRole: Role) {
  return userRole === Role.ADMIN
    ? { id: unitId }
    : { id: unitId, OR: [{ type: EntityType.SYSTEM }, { userId }] };
}

// ─── List ────────────────────────────────────────────────────────────────────

export async function listProducts(userId: number, userRole: Role) {
  const products = (await prisma.product.findMany({
    where: accessFilter(userId, userRole),
    select: productSelect,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })) as ProductRow[];

  if (userRole === Role.ADMIN) {
    return products.map((p) => ({ ...p, lastPrice: null }));
  }

  const productIds = products.map((p) => p.id);
  const lastItems = await prisma.purchaseItem.findMany({
    where: { productId: { in: productIds }, purchase: { userId } },
    orderBy: { purchase: { date: "desc" } },
    select: { productId: true, pricePerUnit: true },
    distinct: ["productId"],
  });

  const priceMap = new Map(lastItems.map((i) => [i.productId, i.pricePerUnit]));
  return products.map((p) => ({ ...p, lastPrice: priceMap.get(p.id) ?? null }));
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createProduct(
  userId: number,
  userRole: Role,
  data: { name: string; unitId: number },
) {
  const isSystem = userRole === Role.ADMIN;

  const unit = await prisma.unit.findFirst({
    where: unitWhereClause(data.unitId, userId, userRole),
  });
  if (!unit) throw new AppError("একক পাওয়া যায়নি বা অ্যাক্সেস নেই", 404);

  const trimmedName = data.name.trim();
  if (!trimmedName) throw new AppError("পণ্যের নাম দিন", 400);

  const conflictScope = isSystem
    ? { type: EntityType.SYSTEM }
    : { OR: [{ type: EntityType.SYSTEM }, { userId }] };

  const conflict = await prisma.product.findFirst({
    where: { name: { equals: trimmedName, mode: "insensitive" }, ...conflictScope },
  });
  if (conflict) throw new AppError("এই নামে একটি পণ্য ইতিমধ্যে আছে", 409);

  return prisma.product.create({
    data: {
      name: trimmedName,
      type: isSystem ? EntityType.SYSTEM : EntityType.USER,
      unitId: data.unitId,
      userId: isSystem ? null : userId,
    },
    select: productSelect,
  });
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateProduct(
  userId: number,
  userRole: Role,
  productId: number,
  data: { name?: string; unitId?: number },
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("পণ্য পাওয়া যায়নি", 404);
  assertCanMutate(product as Ownership, userId, userRole, "পণ্য", "পরিবর্তন");

  if (data.unitId !== undefined) {
    const unit = await prisma.unit.findFirst({
      where: unitWhereClause(data.unitId, userId, userRole),
    });
    if (!unit) throw new AppError("একক পাওয়া যায়নি বা অ্যাক্সেস নেই", 404);
  }

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new AppError("পণ্যের নাম দিন", 400);

    const conflictScope =
      product.type === EntityType.SYSTEM
        ? { type: EntityType.SYSTEM }
        : { OR: [{ type: EntityType.SYSTEM }, { userId: product.userId }] };

    const conflict = await prisma.product.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        ...conflictScope,
        NOT: { id: productId },
      },
    });
    if (conflict) throw new AppError("এই নামে একটি পণ্য ইতিমধ্যে আছে", 409);
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.unitId !== undefined && { unitId: data.unitId }),
    },
    select: productSelect,
  });
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteProduct(userId: number, userRole: Role, productId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("পণ্য পাওয়া যায়নি", 404);
  assertCanMutate(product as Ownership, userId, userRole, "পণ্য", "মুছে ফেলা");

  const inUse = await prisma.purchaseItem.findFirst({ where: { productId } });
  if (inUse) {
    throw new AppError("এই পণ্যটি ক্রয় ইতিহাসে ব্যবহৃত হয়েছে, মুছে ফেলা যাবে না", 409);
  }

  await prisma.product.delete({ where: { id: productId } });
}
