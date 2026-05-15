import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateBody } from "../../utils/validate";
import {
  createPurchase,
  deletePurchase,
  getPriceTrend,
  getPurchaseById,
  getPurchases,
  getSummaryReport,
  updatePurchase,
} from "./purchases.controller";
import { createPurchaseSchema, updatePurchaseSchema } from "./purchases.schema";

const router = Router();

router.use(authMiddleware);
router.get("/report/summary", getSummaryReport);
router.post("/", validateBody(createPurchaseSchema), createPurchase);
router.patch("/:id", validateBody(updatePurchaseSchema), updatePurchase);
router.delete("/:id", deletePurchase);
router.get("/trend/:productId", getPriceTrend);
router.get("/", getPurchases);
router.get("/:id", getPurchaseById);

export default router;
