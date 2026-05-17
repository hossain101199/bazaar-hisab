import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePositiveInt } from "../../utils/parseId";
import {
  listProducts,
  createProduct as svcCreate,
  deleteProduct as svcDelete,
  updateProduct as svcUpdate,
} from "./products.service";
import type { CreateProductInput, UpdateProductInput } from "./products.schema";

export async function getProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const products = await listProducts(req.userId!);
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const { name, type, unitId } = req.body as CreateProductInput;
    const product = await svcCreate(req.userId!, req.userRole ?? "USER", {
      name,
      type,
      unitId,
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
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
    const { name, unitId } = req.body as UpdateProductInput;
    const product = await svcUpdate(req.userId!, req.userRole ?? "USER", id, { name, unitId });
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
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
    await svcDelete(req.userId!, req.userRole ?? "USER", id);
    res.json({ success: true, message: "পণ্য মুছে ফেলা হয়েছে" });
  } catch (err) {
    next(err);
  }
}
