import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateBody } from "../../utils/validate";
import { createProduct, deleteProduct, getProducts, updateProduct } from "./products.controller";
import { createProductSchema, updateProductSchema } from "./products.schema";

const router = Router();
router.use(authMiddleware);

router.get("/", getProducts);
router.post("/", validateBody(createProductSchema), createProduct);
router.patch("/:id", validateBody(updateProductSchema), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
