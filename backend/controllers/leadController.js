import Lead from "../models/Lead.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import { successResponse, errorResponse, paginatedResponse } from "../services/utils/responseHelper.js";
import { invalidateCache } from "./dashboardController.js";

// GET /api/leads
export const getLeads = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const { search, status, source, sort_by = "created_at", sort_order = "desc" } = req.query;

    const filter = { deleted_at: null };
    if (req.user.role !== "admin") filter.user_id = userId;

    if (status && status !== "all") filter.status = status;
    if (source && source !== "all") filter.source = source;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ];
    }

    const sortObj = {};
    const allowedSort = ["name", "email", "created_at", "updated_at", "status"];
    sortObj[allowedSort.includes(sort_by) ? sort_by : "created_at"] = sort_order === "asc" ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filter)
    ]);

    return paginatedResponse(res, leads, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/leads/:id
export const getLeadById = async (req, res) => {
  try {
    const query = { _id: req.params.id, deleted_at: null };
    if (req.user.role !== "admin") query.user_id = req.user.id;
    const lead = await Lead.findOne(query);
    if (!lead) return errorResponse(res, "Lead not found", 404, "NOT_FOUND");
    return successResponse(res, lead);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// POST /api/leads
export const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, status, source, notes } = req.body;
    const userId = req.user.id;

    if (!name || name.length < 3) return errorResponse(res, "Name must be at least 3 characters", 422, "VALIDATION_ERROR");
    if (!email) return errorResponse(res, "Email is required", 422, "VALIDATION_ERROR");

    // Check duplicate email
    const existing = await Lead.findOne({ email: email.toLowerCase(), deleted_at: null });
    if (existing) return errorResponse(res, "Lead with this email already exists", 409, "CONFLICT", { existingLeadId: existing._id });

    const lead = await Lead.create({
      user_id: userId,
      name, email: email.toLowerCase(), phone, company,
      status: status || "new",
      source: source || "other",
      notes
    });

    // Log activity
    await Activity.create({
      user_id: userId,
      activity_type: "lead_created",
      description: `New lead "${name}" was created`,
      related_entity: `lead_${lead._id}`
    });

    // Notify user
    await Notification.create({
      userId: userId,
      message: `New Lead "${name}" was successfully added.`,
      type: "lead_created"
    });

    invalidateCache(userId);
    return successResponse(res, lead, 201);
  } catch (error) {
    if (error.code === 11000) return errorResponse(res, "Lead with this email already exists", 409, "CONFLICT");
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/leads/:id
export const updateLead = async (req, res) => {
  try {
    const { name, email, phone, company, status, source, notes } = req.body;
    const userId = req.user.id;

    if (name && name.length < 3) return errorResponse(res, "Name must be at least 3 characters", 422, "VALIDATION_ERROR");

    const query = { _id: req.params.id, deleted_at: null };
    if (req.user.role !== "admin") query.user_id = userId;
    const lead = await Lead.findOne(query);
    if (!lead) return errorResponse(res, "Lead not found", 404, "NOT_FOUND");

    // Check duplicate email if email changed
    if (email && email.toLowerCase() !== lead.email) {
      const existing = await Lead.findOne({ email: email.toLowerCase(), deleted_at: null, _id: { $ne: lead._id } });
      if (existing) return errorResponse(res, "Lead with this email already exists", 409, "CONFLICT", { existingLeadId: existing._id });
    }

    const oldStatus = lead.status;
    Object.assign(lead, {
      ...(name && { name }),
      ...(email && { email: email.toLowerCase() }),
      ...(phone !== undefined && { phone }),
      ...(company !== undefined && { company }),
      ...(status && { status }),
      ...(source && { source }),
      ...(notes !== undefined && { notes })
    });

    await lead.save();

    // Log activity if status changed
    if (status && status !== oldStatus) {
      await Activity.create({
        user_id: userId,
        activity_type: "lead_updated",
        description: `Lead "${lead.name}" status changed from "${oldStatus}" to "${status}"`,
        related_entity: `lead_${lead._id}`
      });
    }

    invalidateCache(userId);
    return successResponse(res, lead);
  } catch (error) {
    if (error.code === 11000) return errorResponse(res, "Lead with this email already exists", 409, "CONFLICT");
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// DELETE /api/leads/:id (soft delete)
export const deleteLead = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = { _id: req.params.id, deleted_at: null };
    if (req.user.role !== "admin") query.user_id = userId;
    const lead = await Lead.findOne(query);
    if (!lead) return errorResponse(res, "Lead not found", 404, "NOT_FOUND");

    lead.deleted_at = new Date();
    lead.status = "deleted";
    await lead.save();

    await Activity.create({
      user_id: userId,
      activity_type: "lead_deleted",
      description: `Lead "${lead.name}" was deleted`,
      related_entity: `lead_${lead._id}`
    });

    invalidateCache(userId);
    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
