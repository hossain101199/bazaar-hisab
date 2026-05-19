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
  shop: { select: { id: true, name: true } },
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

async function validateShopAccess(userId: number, shopId: number) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { type: true, userId: true } });
  if (!shop) throw new AppError("দোকান পাওয়া যায়নি", 404);
  if (shop.type !== "SYSTEM" && shop.userId !== userId) {
    throw new AppError("অননুমোদিত দোকান ব্যবহার", 403);
  }
}

async function validateProductAccess(userId: number, productIds: number[]) {
  const uniqueIds = [...new Set(productIds)];
  const found = await prisma.product.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, type: true, userId: true },
  });
  if (found.length !== uniqueIds.length) {
    throw new AppError("একটি বা একাধিক পণ্য পাওয়া যায়নি", 404);
  }
  for (const p of found) {
    if (p.type !== "SYSTEM" && p.userId !== userId) {
      throw new AppError("অননুমোদিত পণ্য ব্যবহার", 403);
    }
  }
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
  data: { date: string; note?: string; shopId?: number; items: ItemInput[] },
) {
  validateItems(data.items);
  await validateProductAccess(userId, data.items.map((i) => i.productId));
  if (data.shopId) await validateShopAccess(userId, data.shopId);

  return prisma.purchase.create({
    data: {
      date: new Date(data.date),
      note: data.note ?? null,
      shopId: data.shopId ?? null,
      totalAmount: calcTotal(data.items),
      userId,
      items: { create: data.items.map(buildItemData) },
    },
    select: purchaseSelect,
  });
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updatePurchase(
  userId: number,
  purchaseId: number,
  data: { date?: string; note?: string | null; shopId?: number | null; items?: ItemInput[] },
) {
  const existing = await prisma.purchase.findFirst({ where: { id: purchaseId, userId } });
  if (!existing) throw new AppError("ক্রয় পাওয়া যায়নি", 404);

  if (data.items !== undefined) {
    validateItems(data.items);
    await validateProductAccess(userId, data.items.map((i) => i.productId));
  }
  if (data.shopId) await validateShopAccess(userId, data.shopId);

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
        ...(data.shopId !== undefined && { shopId: data.shopId }),
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

  // PurchaseItem has onDelete: Cascade on purchaseId — items are deleted automatically.
  await prisma.purchase.delete({ where: { id: purchaseId } });
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

// ─── Top Products ────────────────────────────────────────────────────────────

export async function getTopProducts(
  userId: number,
  opts: { year?: number; month?: string; limit?: number },
) {
  const { year, month, limit = 10 } = opts;

  let dateRange: { gte: Date; lt: Date } | undefined;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateRange = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else if (year) {
    dateRange = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }

  const grouped = await prisma.purchaseItem.groupBy({
    by: ["productId"],
    where: { purchase: { userId, ...(dateRange && { date: dateRange }) } },
    _sum: { totalPrice: true, quantity: true },
    _count: { id: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const productIds = grouped.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unit: { select: { name: true } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return grouped.map((item) => ({
    product: productMap.get(item.productId)!,
    totalSpent: item._sum.totalPrice ?? 0,
    totalQuantity: item._sum.quantity ?? 0,
    purchaseCount: item._count.id,
  }));
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

// ─── Shop Report ─────────────────────────────────────────────────────────────

export async function getShopReport(
  userId: number,
  opts: { year?: number; month?: string },
) {
  const { year, month } = opts;

  let dateRange: { gte: Date; lt: Date } | undefined;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateRange = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else if (year) {
    dateRange = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }

  // DB-তেই group + sum — JS memory-তে সব row টানা হয় না
  const grouped = await prisma.purchase.groupBy({
    by: ["shopId"],
    where: {
      userId,
      shopId: { not: null },
      ...(dateRange && { date: dateRange }),
    },
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  if (grouped.length === 0) return [];

  const shopIds = grouped.map((g) => g.shopId!);
  const shops = await prisma.shop.findMany({
    where: { id: { in: shopIds } },
    select: { id: true, name: true },
  });

  const shopMap = new Map(shops.map((s) => [s.id, s]));

  return grouped
    .filter((g) => shopMap.has(g.shopId!))
    .map((g) => ({
      shop: shopMap.get(g.shopId!)!,
      totalSpent: g._sum.totalAmount ?? 0,
      purchaseCount: g._count.id,
    }));
}

// ─── Product By Shop ─────────────────────────────────────────────────────────

export async function getProductByShop(userId: number, productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, OR: [{ type: "SYSTEM" }, { userId }] },
    select: { id: true, name: true, unit: { select: { name: true } } },
  });
  if (!product) throw new AppError("পণ্য পাওয়া যায়নি", 404);

  const items = await prisma.purchaseItem.findMany({
    where: { productId, purchase: { userId } },
    select: {
      pricePerUnit: true,
      purchase: { select: { date: true, shopId: true, shop: { select: { id: true, name: true } } } },
    },
    orderBy: { purchase: { date: "asc" } },
  });

  const map = new Map<number, { shop: { id: number; name: string }; prices: number[]; lastDate: Date }>();
  for (const item of items) {
    if (!item.purchase.shop || !item.purchase.shopId) continue;
    let entry = map.get(item.purchase.shopId);
    if (!entry) {
      entry = { shop: item.purchase.shop, prices: [], lastDate: item.purchase.date };
      map.set(item.purchase.shopId, entry);
    }
    entry.prices.push(item.pricePerUnit);
    if (item.purchase.date > entry.lastDate) entry.lastDate = item.purchase.date;
  }

  return {
    product,
    shops: Array.from(map.values()).map((entry) => ({
      shop: entry.shop,
      avgPricePerUnit: entry.prices.reduce((s, p) => s + p, 0) / entry.prices.length,
      purchaseCount: entry.prices.length,
      lastPricePerUnit: entry.prices[entry.prices.length - 1],
      lastDate: entry.lastDate,
    })).sort((a, b) => a.avgPricePerUnit - b.avgPricePerUnit),
  };
}
