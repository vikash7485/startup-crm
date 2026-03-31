import Deal from "../models/Deal.js";
import DealActivity from "../models/DealActivity.js";
import Activity from "../models/Activity.js";
import Lead from "../models/Lead.js";
import { successResponse, errorResponse } from "../services/utils/responseHelper.js";
import { invalidateCache } from "./dashboardController.js";

// GET /api/deals
export const getDeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, lead_id, sort_by = "created_at", sort_order = "desc" } = req.query;

    const filter = { user_id: userId };
    if (status) filter.status = status;
    if (lead_id) filter.lead_id = lead_id;

    const sortObj = {};
    const allowedSort = ["created_at", "value", "probability", "title"];
    sortObj[allowedSort.includes(sort_by) ? sort_by : "created_at"] = sort_order === "asc" ? 1 : -1;

    const deals = await Deal.find(filter).sort(sortObj).populate("lead_id", "name email company").lean();
    return successResponse(res, { deals, total: deals.length });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/deals/kanban
export const getKanban = async (req, res) => {
  try {
    const userId = req.user.id;
    const deals = await Deal.find({ user_id: userId }).populate("lead_id", "name email company").lean();

    const kanban = {
      "to-do": [],
      "in-progress": [],
      "negotiation": [],
      "closed": []
    };

    deals.forEach(deal => {
      if (kanban[deal.status]) kanban[deal.status].push(deal);
    });

    return successResponse(res, kanban);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/deals/:id
export const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, user_id: req.user.id })
      .populate("lead_id", "name email company phone");
    if (!deal) return errorResponse(res, "Deal not found", 404, "NOT_FOUND");

    const activities = await DealActivity.find({ deal_id: deal._id }).sort({ created_at: -1 }).limit(20).lean();

    return successResponse(res, { ...deal.toObject(), activities });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// POST /api/deals
export const createDeal = async (req, res) => {
  try {
    const { lead_id, title, value, status, deal_type, probability, expected_close_date, notes } = req.body;
    const userId = req.user.id;

    if (!title || title.length < 3) return errorResponse(res, "Title must be at least 3 characters", 422, "VALIDATION_ERROR");
    if (value === undefined || value < 0) return errorResponse(res, "Value must be >= 0", 422, "VALIDATION_ERROR");
    if (!lead_id) return errorResponse(res, "Lead is required", 422, "VALIDATION_ERROR");

    // Verify lead exists and belongs to user
    const lead = await Lead.findOne({ _id: lead_id, user_id: userId, deleted_at: null });
    if (!lead) return errorResponse(res, "Lead not found or doesn't belong to you", 404, "NOT_FOUND");

    const deal = await Deal.create({
      user_id: userId, lead_id, title, value,
      status: status || "to-do",
      deal_type: deal_type || "pending",
      probability: probability ?? 50,
      expected_close_date: expected_close_date || null,
      notes
    });

    // Log deal activity
    await DealActivity.create({
      deal_id: deal._id,
      activity_type: "deal_created",
      new_value: `Deal "${title}" created with value $${value}`
    });

    // Log global activity
    await Activity.create({
      user_id: userId,
      activity_type: "deal_created",
      description: `New deal "${title}" created for lead "${lead.name}"`,
      related_entity: `deal_${deal._id}`
    });

    invalidateCache(userId);
    return successResponse(res, deal, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/deals/:id
export const updateDeal = async (req, res) => {
  try {
    const { title, value, status, deal_type, probability, expected_close_date, notes } = req.body;
    const userId = req.user.id;

    const deal = await Deal.findOne({ _id: req.params.id, user_id: userId });
    if (!deal) return errorResponse(res, "Deal not found", 404, "NOT_FOUND");

    const oldStatus = deal.status;
    const oldValue = deal.value;
    const oldDealType = deal.deal_type;

    // If closing, require deal_type
    if (status === "closed" && !deal_type && deal.deal_type === "pending") {
      return errorResponse(res, "When closing a deal, deal_type (won/lost) must be specified", 422, "VALIDATION_ERROR");
    }

    Object.assign(deal, {
      ...(title && { title }),
      ...(value !== undefined && { value }),
      ...(status && { status }),
      ...(deal_type && { deal_type }),
      ...(probability !== undefined && { probability }),
      ...(expected_close_date !== undefined && { expected_close_date: expected_close_date || null }),
      ...(notes !== undefined && { notes })
    });

    await deal.save();

    // Log deal activities
    if (status && status !== oldStatus) {
      await DealActivity.create({
        deal_id: deal._id,
        activity_type: "status_changed",
        old_value: oldStatus,
        new_value: status
      });
      await Activity.create({
        user_id: userId,
        activity_type: status === "closed" ? "deal_closed" : "deal_status_changed",
        description: `Deal "${deal.title}" moved from "${oldStatus}" to "${status}"`,
        related_entity: `deal_${deal._id}`
      });
    }

    if (value !== undefined && value !== oldValue) {
      await DealActivity.create({
        deal_id: deal._id,
        activity_type: "value_updated",
        old_value: String(oldValue),
        new_value: String(value)
      });
    }

    if (deal_type && deal_type !== oldDealType) {
      await DealActivity.create({
        deal_id: deal._id,
        activity_type: "deal_type_changed",
        old_value: oldDealType,
        new_value: deal_type
      });
    }

    invalidateCache(userId);
    return successResponse(res, deal);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/deals/:id/status (drag-and-drop)
export const updateDealStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    const validStatuses = ["to-do", "in-progress", "negotiation", "closed"];

    if (!status || !validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 422, "VALIDATION_ERROR");
    }

    const deal = await Deal.findOne({ _id: req.params.id, user_id: userId });
    if (!deal) return errorResponse(res, "Deal not found", 404, "NOT_FOUND");

    const oldStatus = deal.status;
    if (oldStatus === status) return successResponse(res, deal);

    deal.status = status;
    await deal.save();

    await DealActivity.create({
      deal_id: deal._id,
      activity_type: "status_changed",
      old_value: oldStatus,
      new_value: status
    });

    await Activity.create({
      user_id: userId,
      activity_type: "deal_status_changed",
      description: `Deal "${deal.title}" moved from "${oldStatus}" to "${status}"`,
      related_entity: `deal_${deal._id}`
    });

    invalidateCache(userId);
    return successResponse(res, deal);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// DELETE /api/deals/:id
export const deleteDeal = async (req, res) => {
  try {
    const userId = req.user.id;
    const deal = await Deal.findOne({ _id: req.params.id, user_id: userId });
    if (!deal) return errorResponse(res, "Deal not found", 404, "NOT_FOUND");

    await Deal.deleteOne({ _id: deal._id });
    await DealActivity.deleteMany({ deal_id: deal._id });

    await Activity.create({
      user_id: userId,
      activity_type: "deal_updated",
      description: `Deal "${deal.title}" was deleted`,
      related_entity: `deal_${deal._id}`
    });

    invalidateCache(userId);
    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
