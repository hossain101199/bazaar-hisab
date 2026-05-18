import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateBody } from "../../utils/validate";
import { createShop, deleteShop, getShops, updateShop } from "./shops.controller";
import { createShopSchema, updateShopSchema } from "./shops.schema";

const router = Router();

router.use(authMiddleware);
router.get("/", getShops);
router.post("/", validateBody(createShopSchema), createShop);
router.patch("/:id", validateBody(updateShopSchema), updateShop);
router.delete("/:id", deleteShop);

export default router;
