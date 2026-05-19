import { Role } from "@prisma/client";
import prisma from "../../prisma";
import { AppError } from "../../utils/AppError";

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
  type: string;
  userId: number | null;
  unitId: number;
  unit: { id: number; name: string };
};

type ProductOwnership = { type: string; userId: number | null };

function assertUserOwnsProduct(
  product: ProductOwnership,
  userId: number,
  userRole: Role,
  action: "পরিবর্তন" | "মুছে ফেলা",
) {
  if (product.type === "SYSTEM") {
    if (userRole !== Role.ADMIN) throw new AppError(`SYSTEM পণ্য ${action} করা যাবে না`, 403);
    return;
  }
  if (product.userId !== userId) {
    throw new AppError(`এই পণ্য ${action}ের অনুমতি নেই`, 403);
  }
}

export async function listProducts(userId: number) {
  const products = await prisma.product.findMany({
    where: { OR: [{ type: "SYSTEM" }, { type: "USER", userId }] },
    select: productSelect,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  }) as ProductRow[];

  const productIds = products.map((p) => p.id);

  const lastItems = await prisma.purchaseItem.findMany({
    where: { productId: { in: productIds }, purchase: { userId } },
    orderBy: { purchase: { date: "desc" } },
    select: { productId: true, pricePerUnit: true },
    distinct: ["productId"],
  });

  const priceMap = new Map(lastItems.map((item) => [item.productId, item.pricePerUnit]));
  return products.map((p) => ({ ...p, lastPrice: priceMap.get(p.id) ?? null }));
}

export async function createProduct(
  userId: number,
  userRole: Role,
  data: { name: string; type?: string; unitId: number },
) {
  const isSystem = data.type === "SYSTEM";
  if (isSystem && userRole !== Role.ADMIN) {
    throw new AppError("শুধুমাত্র Admin SYSTEM পণ্য তৈরি করতে পারবেন", 403);
  }

  // SYSTEM products must use SYSTEM units so all users can see the unit.
  // USER products may use any unit visible to this user (SYSTEM or own USER).
  const unit = await prisma.unit.findFirst({
    where: isSystem
      ? { id: data.unitId, type: "SYSTEM" }
      : { id: data.unitId, OR: [{ type: "SYSTEM" }, { userId }] },
  });
  if (!unit) throw new AppError(
    isSystem ? "SYSTEM একক দিন (শুধুমাত্র SYSTEM একক ব্যবহার করা যাবে)" : "একক পাওয়া যায়নি বা অ্যাক্সেস নেই",
    404,
  );

  const trimmedName = data.name.trim();
  if (!trimmedName) throw new AppError("পণ্যের নাম দিন", 400);

  const conflict = await prisma.product.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
      ...(isSystem
        ? { type: "SYSTEM" }
        : { OR: [{ type: "SYSTEM" }, { userId }] }
      ),
    },
  });
  if (conflict) throw new AppError("এই নামে একটি পণ্য ইতিমধ্যে আছে", 409);

  return prisma.product.create({
    data: {
      name: trimmedName,
      type: isSystem ? "SYSTEM" : "USER",
      unitId: data.unitId,
      userId: isSystem ? null : userId,
    },
    select: productSelect,
  });
}

export async function updateProduct(
  userId: number,
  userRole: Role,
  productId: number,
  data: { name?: string; unitId?: number },
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("পণ্য পাওয়া যায়নি", 404);
  assertUserOwnsProduct(product, userId, userRole, "পরিবর্তন");

  if (data.unitId !== undefined) {
    // Preserve the same SYSTEM/USER constraint as creation.
    const unit = await prisma.unit.findFirst({
      where: product.type === "SYSTEM"
        ? { id: data.unitId, type: "SYSTEM" }
        : { id: data.unitId, OR: [{ type: "SYSTEM" }, { userId }] },
    });
    if (!unit) throw new AppError(
      product.type === "SYSTEM"
        ? "SYSTEM একক দিন (শুধুমাত্র SYSTEM একক ব্যবহার করা যাবে)"
        : "একক পাওয়া যায়নি বা অ্যাক্সেস নেই",
      404,
    );
  }

  if (data.name !== undefined) {
    const trimmedName = data.name.trim();
    if (!trimmedName) throw new AppError("পণ্যের নাম দিন", 400);

    // Admin editing SYSTEM: check only against other SYSTEM products
    // User editing own USER product: check against SYSTEM + own USER products
    const conflict = await prisma.product.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        ...(product.type === "SYSTEM"
          ? { type: "SYSTEM" }
          : { OR: [{ type: "SYSTEM" }, { userId }] }
        ),
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

export async function deleteProduct(userId: number, userRole: Role, productId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("পণ্য পাওয়া যায়নি", 404);
  assertUserOwnsProduct(product, userId, userRole, "মুছে ফেলা");

  const usedInPurchase = await prisma.purchaseItem.findFirst({ where: { productId } });
  if (usedInPurchase) {
    throw new AppError("এই পণ্যটি ক্রয় ইতিহাসে ব্যবহৃত হয়েছে, মুছে ফেলা যাবে না", 409);
  }

  await prisma.product.delete({ where: { id: productId } });
}
