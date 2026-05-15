import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePositiveInt } from "../../utils/parseId";
import { sanitizeSearch } from "../../validators";
import {
  getPurchase,
  getSummary,
  listPurchases,
  createPurchase as svcCreate,
  deletePurchase as svcDelete,
  getPriceTrend as svcTrend,
  updatePurchase as svcUpdate,
} from "./purchases.service";
import type { CreatePurchaseInput, UpdatePurchaseInput } from "./purchases.schema";

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

    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ success: false, message: "month ফরম্যাট হবে YYYY-MM" });
      return;
    }

    if (search) search = sanitizeSearch(search);

    const result = await listPurchases(req.userId!, { month, search, page, limit });
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
    const purchase = await getPurchase(req.userId!, id);
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
    const { date, note, items } = req.body as CreatePurchaseInput;
    const purchase = await svcCreate(req.userId!, { date, note, items });
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

    const { date, note, items } = req.body as UpdatePurchaseInput;
    const purchase = await svcUpdate(req.userId!, id, { date, note, items });
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
    await svcDelete(req.userId!, id);
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
    let year: number | undefined;
    if (req.query.year !== undefined) {
      year = parseInt(req.query.year as string);
      if (isNaN(year)) {
        res.status(400).json({ success: false, message: "বৈধ year দিন" });
        return;
      }
    }
    const summary = await getSummary(req.userId!, year);
    res.json({ success: true, summary });
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
    const result = await svcTrend(req.userId!, productId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
