import Reminder from "../models/Reminder.js";
import Lead from "../models/Lead.js";
import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../services/utils/responseHelper.js";

// GET /api/reminders/upcoming
export const getUpcomingReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ 
      userId: req.user.id, 
      completed: false,
      reminderDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    })
    .populate("leadId", "name email")
    .sort({ reminderDate: 1 })
    .limit(10)
    .lean();

    return successResponse(res, reminders);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/reminders/lead/:leadId
export const getRemindersByLead = async (req, res) => {
  try {
    const query = { leadId: req.params.leadId };
    if (req.user.role !== "admin") query.userId = req.user.id;
    
    const reminders = await Reminder.find(query)
      .sort({ reminderDate: 1 })
      .lean();

    return successResponse(res, reminders);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// POST /api/reminders
export const createReminder = async (req, res) => {
  try {
    const { leadId, title, description, reminderDate } = req.body;
    
    const leadQuery = { _id: leadId, deleted_at: null };
    if (req.user.role !== "admin") leadQuery.user_id = req.user.id;
    const lead = await Lead.findOne(leadQuery);
    if (!lead) return errorResponse(res, "Lead not found or access denied", 404, "NOT_FOUND");

    const reminder = await Reminder.create({
      leadId,
      userId: req.user.id,
      title,
      description,
      reminderDate
    });

    return successResponse(res, reminder, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/reminders/:id/complete
export const completeReminder = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") query.userId = req.user.id;
    
    const reminder = await Reminder.findOneAndUpdate(query, { completed: true }, { new: true });
    if (!reminder) return errorResponse(res, "Reminder not found", 404, "NOT_FOUND");

    return successResponse(res, reminder);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// DELETE /api/reminders/:id
export const deleteReminder = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") query.userId = req.user.id;
    
    const deleted = await Reminder.findOneAndDelete(query);
    if (!deleted) return errorResponse(res, "Reminder not found", 404, "NOT_FOUND");

    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
