import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getUsers } from "./admin.controller";

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get("/users", getUsers);

export default router;
