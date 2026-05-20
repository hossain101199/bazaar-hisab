import { Role } from "@prisma/client";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { parsePositiveInt } from "../../utils/parseId";
import {
  listUnits,
  createUnit as svcCreate,
  updateUnit as svcUpdate,
  deleteUnit as svcDelete,
  convertUnits,
} from "./units.service";
import type { CreateUnitInput, UpdateUnitInput } from "./units.schema";

export async function getUnits(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const units = await listUnits(req.userId!, req.userRole ?? Role.USER);
    res.json({ success: true, units });
  } catch (err) {
    next(err);
  }
}

export async function createUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, groupKey, baseRatio } = req.body as CreateUnitInput;
    const unit = await svcCreate(req.userId!, req.userRole ?? Role.USER, { name, groupKey, baseRatio });
    res.status(201).json({ success: true, unit });
  } catch (err) {
    next(err);
  }
}

export async function updateUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    const { name, groupKey, baseRatio } = req.body as UpdateUnitInput;
    const unit = await svcUpdate(req.userId!, req.userRole ?? Role.USER, id, { name, groupKey, baseRatio });
    res.json({ success: true, unit });
  } catch (err) {
    next(err);
  }
}

export async function deleteUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid id" });
      return;
    }
    await svcDelete(req.userId!, req.userRole ?? Role.USER, id);
    res.json({ success: true, message: "একক মুছে ফেলা হয়েছে" });
  } catch (err) {
    next(err);
  }
}

export async function convertUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const fromId = parsePositiveInt(req.query.from as string);
    const toId = parsePositiveInt(req.query.to as string);
    const value = parseFloat(req.query.value as string);
    if (!fromId || !toId || isNaN(value)) {
      res.status(400).json({ success: false, message: "?from=<id>&to=<id>&value=<number> দিন" });
      return;
    }
    const result = await convertUnits(fromId, toId, value, req.userId!, req.userRole ?? Role.USER);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
