import { Role } from "@prisma/client";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePositiveInt } from "../../utils/parseId";
import { sanitizeSearch } from "../../utils/sanitize";
import {
  getPurchase,
  getSummary,
  getTopProducts as svcTopProducts,
  listPurchases,
  createPurchase as svcCreate,
  deletePurchase as svcDelete,
  getPriceTrend as svcTrend,
  updatePurchase as svcUpdate,
  getShopReport as svcShopReport,
  getProductByShop as svcProductByShop,
} from "./purchases.service";
import type { CreatePurchaseInput, UpdatePurchaseInput } from "./purchases.schema";

const MONTH_RE = /^\d{4}-\d{2}$/;

function parseReportParams(query: Record<string, unknown>): { year: number | undefined; month: string | undefined; error?: string } {
  const month = query.month as string | undefined;
  if (month && !MONTH_RE.test(month)) {
    return { year: undefined, month: undefined, error: "month ফরম্যাট হবে YYYY-MM" };
  }
  let year: number | undefined;
  if (!month && query.year !== undefined) {
    year = parseInt(query.year as string);
    if (isNaN(year)) return { year: undefined, month: undefined, error: "বৈধ year দিন" };
  }
  return { year, month };
}

export async function getPurchases(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const page = Math.max(1, Math.min(10000, parseInt(req.query.page as string) || 1));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const month = req.query.month as string | undefined;
    let search = req.query.search as string | undefined;

    if (month && !MONTH_RE.test(month)) {
      res.status(400).json({ success: false, message: "month ফরম্যাট হবে YYYY-MM" });
      return;
    }

    if (search) search = sanitizeSearch(search);

    const result = await listPurchases(req.userId!, req.userRole ?? Role.USER, { month, search, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getPurchaseById(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    const purchase = await getPurchase(req.userId!, req.userRole ?? Role.USER, id);
    res.json({ success: true, purchase });
  } catch (err) {
    next(err);
  }
}

export async function createPurchase(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.userRole === Role.ADMIN) {
      res.status(403).json({ success: false, message: "Admin ক্রয় তৈরি করতে পারবেন না" });
      return;
    }
    const { date, note, shopId, items } = req.body as CreatePurchaseInput;
    const purchase = await svcCreate(req.userId!, { date, note, shopId, items });
    res.status(201).json({ success: true, purchase });
  } catch (err) {
    next(err);
  }
}

export async function updatePurchase(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    const { date, note, shopId, items } = req.body as UpdatePurchaseInput;
    const purchase = await svcUpdate(req.userId!, req.userRole ?? Role.USER, id, { date, note, shopId, items });
    res.json({ success: true, purchase });
  } catch (err) {
    next(err);
  }
}

export async function deletePurchase(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    await svcDelete(req.userId!, req.userRole ?? Role.USER, id);
    res.json({ success: true, message: "ক্রয় মুছে ফেলা হয়েছে" });
  } catch (err) {
    next(err);
  }
}

export async function getSummaryReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { year, error } = parseReportParams(req.query as Record<string, unknown>);
    if (error) { res.status(400).json({ success: false, message: error }); return; }
    const summary = await getSummary(req.userId!, req.userRole ?? Role.USER, year);
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}

export async function getTopProductsReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));
    const { year: parsedYear, month, error } = parseReportParams(req.query as Record<string, unknown>);
    if (error) { res.status(400).json({ success: false, message: error }); return; }
    const year = parsedYear ?? (!month ? new Date().getFullYear() : undefined);

    const result = await svcTopProducts(req.userId!, req.userRole ?? Role.USER, { year, month, limit });
    res.json({ success: true, products: result });
  } catch (err) {
    next(err);
  }
}

export async function getPriceTrend(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const productId = parsePositiveInt(req.params.productId);
    if (!productId) {
      res.status(400).json({ success: false, message: "Invalid productId" });
      return;
    }
    const result = await svcTrend(req.userId!, req.userRole ?? Role.USER, productId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getShopReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { year: parsedYear, month, error } = parseReportParams(req.query as Record<string, unknown>);
    if (error) { res.status(400).json({ success: false, message: error }); return; }
    const year = parsedYear ?? (!month ? new Date().getFullYear() : undefined);

    const result = await svcShopReport(req.userId!, req.userRole ?? Role.USER, { year, month });
    res.json({ success: true, shops: result });
  } catch (err) {
    next(err);
  }
}

export async function getProductByShop(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const productId = parsePositiveInt(req.params.productId);
    if (!productId) {
      res.status(400).json({ success: false, message: "Invalid productId" });
      return;
    }
    const result = await svcProductByShop(req.userId!, req.userRole ?? Role.USER, productId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
