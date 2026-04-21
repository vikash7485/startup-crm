import express from "express";
import { exportData } from "../controllers/exportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:entity/:format", exportData);

export default router;
