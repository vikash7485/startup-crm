import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getDeals, getKanban, getDealById,
  createDeal, updateDeal, updateDealStatus, deleteDeal
} from "../controllers/dealController.js";

const router = express.Router();

router.get("/", authMiddleware, getDeals);
router.get("/kanban", authMiddleware, getKanban);
router.get("/:id", authMiddleware, getDealById);
router.post("/", authMiddleware, createDeal);
router.put("/:id", authMiddleware, updateDeal);
router.put("/:id/status", authMiddleware, updateDealStatus);
router.delete("/:id", authMiddleware, deleteDeal);

export default router;
