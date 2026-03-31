import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getLeads, getLeadById, createLead, updateLead, deleteLead } from "../controllers/leadController.js";

const router = express.Router();

router.get("/", authMiddleware, getLeads);
router.get("/:id", authMiddleware, getLeadById);
router.post("/", authMiddleware, createLead);
router.put("/:id", authMiddleware, updateLead);
router.delete("/:id", authMiddleware, deleteLead);

export default router;
