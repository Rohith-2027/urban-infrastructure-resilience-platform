import { Router } from "express";
import { health, fetchLayer } from "../controllers/infrastructure.controller.js";

/** Routes mounted under /api/infrastructure. */
const router = Router();

router.get("/", health);
router.get("/:layer", fetchLayer);

export default router;
