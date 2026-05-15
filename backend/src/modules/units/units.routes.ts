import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateBody } from "../../utils/validate";
import { convertUnit, createUnit, deleteUnit, getUnits, updateUnit } from "./units.controller";
import { createUnitSchema, updateUnitSchema } from "./units.schema";

const router = Router();
router.use(authMiddleware);

router.get("/", getUnits);
router.get("/convert", convertUnit);
router.post("/", validateBody(createUnitSchema), createUnit);
router.patch("/:id", validateBody(updateUnitSchema), updateUnit);
router.delete("/:id", deleteUnit);

export default router;
