import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getStats, getActivities, getSalesMetrics } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", authMiddleware, getStats);
router.get("/activities", authMiddleware, getActivities);
router.get("/sales-metrics", authMiddleware, getSalesMetrics);

export default router;
