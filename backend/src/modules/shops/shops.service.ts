import { Role } from "@prisma/client";
import prisma from "../../prisma";
import { AppError } from "../../utils/AppError";

export async function listShops(userId: number) {
  return prisma.shop.findMany({
    where: { OR: [{ type: "SYSTEM" }, { userId }] },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createShop(
  userId: number,
  userRole: Role,
  data: { name: string; address?: string; type?: "SYSTEM" | "USER" },
) {
  const type = data.type === "SYSTEM" && userRole === Role.ADMIN ? "SYSTEM" : "USER";
  const ownerId = type === "SYSTEM" ? null : userId;
  const trimmedName = data.name.trim();
  if (!trimmedName) throw new AppError("দোকানের নাম দিন", 400);

  const existing = await prisma.shop.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
      ...(type === "SYSTEM"
        ? { type: "SYSTEM" }
        : { OR: [{ type: "SYSTEM" }, { userId: ownerId }] }
      ),
    },
  });
  if (existing) throw new AppError("এই নামে দোকান আগেই আছে", 409);

  return prisma.shop.create({
    data: { name: trimmedName, address: data.address?.trim() || null, type, userId: ownerId },
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

  if (shop.type === "SYSTEM" && userRole !== Role.ADMIN) {
    throw new AppError("শুধু অ্যাডমিন সিস্টেম দোকান পরিবর্তন করতে পারবেন", 403);
  }
  if (shop.type === "USER" && shop.userId !== userId) {
    throw new AppError("এই দোকান পরিবর্তন করার অনুমতি নেই", 403);
  }

  const trimmedName = data.name?.trim();
  if (trimmedName !== undefined && !trimmedName) throw new AppError("দোকানের নাম দিন", 400);

  if (trimmedName && trimmedName.toLowerCase() !== shop.name.toLowerCase()) {
    const existing = await prisma.shop.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        ...(shop.type === "SYSTEM"
          ? { type: "SYSTEM" }
          : { OR: [{ type: "SYSTEM" }, { userId: shop.userId }] }
        ),
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

export async function deleteShop(userId: number, userRole: string, shopId: number) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new AppError("দোকান পাওয়া যায়নি", 404);

  if (shop.type === "SYSTEM" && userRole !== Role.ADMIN) {
    throw new AppError("শুধু অ্যাডমিন সিস্টেম দোকান মুছতে পারবেন", 403);
  }
  if (shop.type === "USER" && shop.userId !== userId) {
    throw new AppError("এই দোকান মুছে ফেলার অনুমতি নেই", 403);
  }

  await prisma.shop.delete({ where: { id: shopId } });
}
