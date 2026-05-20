import { Role } from "@prisma/client";
import prisma from "../../prisma";
import { AppError } from "../../utils/AppError";

export async function listShops(userId: number, userRole: Role) {
  return prisma.shop.findMany({
    where: userRole === Role.ADMIN ? {} : { userId },
    orderBy: [{ name: "asc" }],
  });
}

export async function createShop(
  userId: number,
  userRole: Role,
  data: { name: string; address?: string },
) {
  if (userRole === Role.ADMIN) {
    throw new AppError("Admin দোকান তৈরি করতে পারবেন না", 403);
  }

  const trimmedName = data.name.trim();
  if (!trimmedName) throw new AppError("দোকানের নাম দিন", 400);

  const existing = await prisma.shop.findFirst({
    where: { name: { equals: trimmedName, mode: "insensitive" }, userId },
  });
  if (existing) throw new AppError("এই নামে দোকান আগেই আছে", 409);

  return prisma.shop.create({
    data: { name: trimmedName, address: data.address?.trim() || null, userId },
  });
}

export async function updateShop(
  userId: number,
  userRole: Role,
  shopId: number,
  data: { name?: string; address?: string | null },
) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new AppError("দোকান পাওয়া যায়নি", 404);

  if (userRole !== Role.ADMIN && shop.userId !== userId) {
    throw new AppError("এই দোকান পরিবর্তন করার অনুমতি নেই", 403);
  }

  const trimmedName = data.name?.trim();
  if (trimmedName !== undefined && !trimmedName) throw new AppError("দোকানের নাম দিন", 400);

  if (trimmedName && trimmedName.toLowerCase() !== shop.name.toLowerCase()) {
    const existing = await prisma.shop.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        userId: shop.userId,
        id: { not: shopId },
      },
    });
    if (existing) throw new AppError("এই নামে দোকান আগেই আছে", 409);
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(trimmedName !== undefined && { name: trimmedName }),
      ...(data.address !== undefined && { address: data.address?.trim() || null }),
    },
  });
}

export async function deleteShop(userId: number, userRole: Role, shopId: number) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new AppError("দোকান পাওয়া যায়নি", 404);

  if (userRole !== Role.ADMIN && shop.userId !== userId) {
    throw new AppError("এই দোকান মুছে ফেলার অনুমতি নেই", 403);
  }

  await prisma.shop.delete({ where: { id: shopId } });
}
