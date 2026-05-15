import { Prisma } from "@prisma/client";
import prisma from "../../prisma";
import { AppError } from "../../utils/AppError";

const itemSelect = {
  id: true,
  quantity: true,
  totalPrice: true,
  pricePerUnit: true,
  product: {
    select: {
      id: true,
      name: true,
      unit: { select: { id: true, name: true } },
    },
  },
} as const;

const purchaseSelect = {
  id: true,
  date: true,
  note: true,
  totalAmount: true,
  createdAt: true,
  items: { select: itemSelect },
} as const;

type ItemInput = { productId: number; quantity: number; totalPrice: number };

function buildItemData(item: ItemInput) {
  return {
    productId: item.productId,
    quantity: item.quantity,
    totalPrice: item.totalPrice,
    pricePerUnit: item.totalPrice / item.quantity,
  };
}

function validateItems(items: ItemInput[]) {
  for (const item of items) {
    if (!item.productId || item.quantity <= 0 || item.totalPrice <= 0) {
      throw new AppError("প্রতিটি আইটেমে productId, quantity > 0, totalPrice > 0 দিন", 400);
    }
  }
}

function calcTotal(items: ItemInput[]) {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

// ─── List ────────────────────────────────────────────────────────────────────

export async function listPurchases(
  userId: number,
  opts: { month?: string; search?: string; page: number; limit: number },
) {
  const { month, search, page, limit } = opts;

  const where: Prisma.PurchaseWhereInput = { userId };

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 1);
    where.date = { gte: from, lt: to };
  }

  if (search) {
    where.OR = [
      { note: { contains: search, mode: "insensitive" } },
      {
        items: {
          some: {
            product: { name: { contains: search, mode: "insensitive" } },
          },
        },
      },
    ];
  }

  const [total, purchases] = await Promise.all([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      select: purchaseSelect,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { purchases, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Single ──────────────────────────────────────────────────────────────────

export async function getPurchase(userId: number, purchaseId: number) {
  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, userId },
    select: purchaseSelect,
  });
  if (!purchase) throw new AppError("ক্রয় পাওয়া যায়নি", 404);
  return purchase;
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createPurchase(
  userId: number,
  data: { date: string; note?: string; items: ItemInput[] },
) {
  validateItems(data.items);

  return prisma.$transaction(async (tx) => {
    return tx.purchase.create({
      data: {
        date: new Date(data.date),
        note: data.note ?? null,
        totalAmount: calcTotal(data.items),
        userId,
        items: { create: data.items.map(buildItemData) },
      },
      select: purchaseSelect,
    });
  });
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updatePurchase(
  userId: number,
  purchaseId: number,
  data: { date?: string; note?: string; items?: ItemInput[] },
) {
  const existing = await prisma.purchase.findFirst({ where: { id: purchaseId, userId } });
  if (!existing) throw new AppError("ক্রয় পাওয়া যায়নি", 404);

  if (data.items !== undefined) validateItems(data.items);

  const totalAmount = data.items !== undefined ? calcTotal(data.items) : existing.totalAmount;

  return prisma.$transaction(async (tx) => {
    if (data.items !== undefined) {
      await tx.purchaseItem.deleteMany({ where: { purchaseId } });
    }

    return tx.purchase.update({
      where: { id: purchaseId },
      data: {
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.note !== undefined && { note: data.note }),
        totalAmount,
        ...(data.items !== undefined && { items: { create: data.items.map(buildItemData) } }),
      },
      select: purchaseSelect,
    });
  });
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deletePurchase(userId: number, purchaseId: number) {
  const existing = await prisma.purchase.findFirst({ where: { id: purchaseId, userId } });
  if (!existing) throw new AppError("ক্রয় পাওয়া যায়নি", 404);

  await prisma.$transaction(async (tx) => {
    await tx.purchaseItem.deleteMany({ where: { purchaseId } });
    await tx.purchase.delete({ where: { id: purchaseId } });
  });
}

// ─── Summary Report ──────────────────────────────────────────────────────────

export async function getSummary(userId: number, year?: number) {
  const targetYear = year ?? new Date().getFullYear();
  const from = new Date(targetYear, 0, 1);
  const to = new Date(targetYear + 1, 0, 1);

  const purchases = await prisma.purchase.findMany({
    where: { userId, date: { gte: from, lt: to } },
    select: { date: true, totalAmount: true },
    orderBy: { date: "asc" },
  });

  const monthly: Record<string, { month: string; totalAmount: number; purchaseCount: number }> = {};
  for (const p of purchases) {
    const month = p.date.toISOString().substring(0, 7);
    if (!monthly[month]) monthly[month] = { month, totalAmount: 0, purchaseCount: 0 };
    monthly[month].totalAmount += p.totalAmount;
    monthly[month].purchaseCount += 1;
  }

  return {
    year: targetYear,
    totalAmount: purchases.reduce((s: number, p: { totalAmount: number }) => s + p.totalAmount, 0),
    months: Object.values(monthly),
  };
}

// ─── Price Trend ─────────────────────────────────────────────────────────────

export async function getPriceTrend(userId: number, productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, OR: [{ type: "SYSTEM" }, { userId }] },
    select: { id: true, name: true, unit: { select: { name: true } } },
  });
  if (!product) throw new AppError("পণ্য পাওয়া যায়নি", 404);

  const items = await prisma.purchaseItem.findMany({
    where: { productId, purchase: { userId } },
    select: { pricePerUnit: true, purchase: { select: { date: true } } },
    orderBy: { purchase: { date: "asc" } },
  });

  return {
    product,
    trend: items.map((item: { pricePerUnit: number; purchase: { date: Date } }) => ({
      date: item.purchase.date,
      pricePerUnit: item.pricePerUnit,
    })),
  };
}
