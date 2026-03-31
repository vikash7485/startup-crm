import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getOverview, getSalesChart, getLeadSources,
  getConversionFunnel, getDealStatusBreakdown
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/overview", authMiddleware, getOverview);
router.get("/sales-chart", authMiddleware, getSalesChart);
router.get("/lead-sources", authMiddleware, getLeadSources);
router.get("/conversion-funnel", authMiddleware, getConversionFunnel);
router.get("/deal-status-breakdown", authMiddleware, getDealStatusBreakdown);

export default router;
