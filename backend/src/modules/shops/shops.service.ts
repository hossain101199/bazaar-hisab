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
  userRole: string,
  data: { name: string; address?: string; type?: "SYSTEM" | "USER" },
) {
  const type = data.type === "SYSTEM" && userRole === "ADMIN" ? "SYSTEM" : "USER";
  const ownerId = type === "SYSTEM" ? null : userId;

  const existing = await prisma.shop.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" }, userId: ownerId },
  });
  if (existing) throw new AppError("এই নামে দোকান আগেই আছে", 409);

  return prisma.shop.create({
    data: { name: data.name, address: data.address ?? null, type, userId: ownerId },
  });
}

export async function updateShop(
  userId: number,
  userRole: string,
  shopId: number,
  data: { name?: string; address?: string },
) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new AppError("দোকান পাওয়া যায়নি", 404);

  if (shop.type === "SYSTEM" && userRole !== "ADMIN") {
    throw new AppError("শুধু অ্যাডমিন সিস্টেম দোকান পরিবর্তন করতে পারবেন", 403);
  }
  if (shop.type === "USER" && shop.userId !== userId) {
    throw new AppError("এই দোকান পরিবর্তন করার অনুমতি নেই", 403);
  }

  if (data.name && data.name.toLowerCase() !== shop.name.toLowerCase()) {
    const existing = await prisma.shop.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        userId: shop.userId,
        id: { not: shopId },
      },
    });
    if (existing) throw new AppError("এই নামে দোকান আগেই আছে", 409);
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
    },
  });
}

export async function deleteShop(userId: number, userRole: string, shopId: number) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new AppError("দোকান পাওয়া যায়নি", 404);

  if (shop.type === "SYSTEM" && userRole !== "ADMIN") {
    throw new AppError("শুধু অ্যাডমিন সিস্টেম দোকান মুছতে পারবেন", 403);
  }
  if (shop.type === "USER" && shop.userId !== userId) {
    throw new AppError("এই দোকান মুছে ফেলার অনুমতি নেই", 403);
  }

  await prisma.shop.delete({ where: { id: shopId } });
}
