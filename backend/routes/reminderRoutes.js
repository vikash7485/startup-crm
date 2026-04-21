import express from "express";
import { getUpcomingReminders, getRemindersByLead, createReminder, completeReminder, deleteReminder } from "../controllers/reminderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/upcoming", getUpcomingReminders);
router.get("/lead/:leadId", getRemindersByLead);
router.post("/", createReminder);
router.put("/:id/complete", completeReminder);
router.delete("/:id", deleteReminder);

export default router;
