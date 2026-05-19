import { Role } from "@prisma/client";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePositiveInt } from "../../utils/parseId";
import {
  createShop as svcCreate,
  deleteShop as svcDelete,
  listShops,
  updateShop as svcUpdate,
} from "./shops.service";
import type { CreateShopInput, UpdateShopInput } from "./shops.schema";

export async function getShops(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const shops = await listShops(req.userId!);
    res.json({ success: true, shops });
  } catch (err) {
    next(err);
  }
}

export async function createShop(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, address, type } = req.body as CreateShopInput;
    const shop = await svcCreate(req.userId!, req.userRole ?? Role.USER, { name, address, type });
    res.status(201).json({ success: true, shop });
  } catch (err) {
    next(err);
  }
}

export async function updateShop(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    const { name, address } = req.body as UpdateShopInput;
    const shop = await svcUpdate(req.userId!, req.userRole ?? Role.USER, id, { name, address });
    res.json({ success: true, shop });
  } catch (err) {
    next(err);
  }
}

export async function deleteShop(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    await svcDelete(req.userId!, req.userRole ?? Role.USER, id);
    res.json({ success: true, message: "দোকান মুছে ফেলা হয়েছে" });
  } catch (err) {
    next(err);
  }
}
