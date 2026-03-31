import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import { successResponse, errorResponse } from "../services/utils/responseHelper.js";

function toObjectId(id) {
  try { return new mongoose.Types.ObjectId(id); } catch { return id; }
}

// GET /api/analytics/overview
export const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userOid = toObjectId(userId);
    const days = parseInt(req.query.date_range) || 30;

    const [total_leads, total_deals, wonDeals, revenueAgg] = await Promise.all([
      Lead.countDocuments({ user_id: userId, deleted_at: null }),
      Deal.countDocuments({ user_id: userId }),
      Deal.countDocuments({ user_id: userId, status: "closed", deal_type: "won" }),
      Deal.aggregate([
        { $match: { user_id: userOid, status: "closed", deal_type: "won" } },
        { $group: { _id: null, total: { $sum: "$value" } } }
      ])
    ]);

    const total_revenue = revenueAgg[0]?.total || 0;
    const conversion_rate = total_leads > 0 ? Math.round((wonDeals / total_leads) * 10000) / 100 : 0;
    const average_deal_value = wonDeals > 0 ? Math.round((total_revenue / wonDeals) * 100) / 100 : 0;

    return successResponse(res, {
      total_leads, total_deals, won_deals: wonDeals,
      total_revenue, conversion_rate, average_deal_value,
      period: `${days} days`
    });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/analytics/sales-chart
export const getSalesChart = async (req, res) => {
  try {
    const userId = req.user.id;
    const userOid = toObjectId(userId);
    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyData = await Deal.aggregate([
      {
        $match: {
          user_id: userOid, status: "closed", deal_type: "won",
          updated_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$updated_at" } },
          revenue: { $sum: "$value" }, deals_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const results = [];
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = monthlyData.find(r => r._id === key);
      results.push({
        month: monthNames[d.getMonth()], month_key: key,
        revenue: found?.revenue || 0, deals_count: found?.deals_count || 0
      });
    }

    return successResponse(res, results);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/analytics/lead-sources
export const getLeadSources = async (req, res) => {
  try {
    const userOid = toObjectId(req.user.id);
    const sources = await Lead.aggregate([
      { $match: { user_id: userOid, deleted_at: null } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const nameMap = { website: "Website", referral: "Referral", event: "Event", cold_call: "Cold Call", other: "Other" };
    const labels = sources.map(s => nameMap[s._id] || s._id);
    const data = sources.map(s => s.count);
    const colors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

    return successResponse(res, { labels, data, colors: colors.slice(0, data.length) });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/analytics/conversion-funnel
export const getConversionFunnel = async (req, res) => {
  try {
    const userId = req.user.id;
    const [totalLeads, contacted, qualified, wonDeals] = await Promise.all([
      Lead.countDocuments({ user_id: userId, deleted_at: null }),
      Lead.countDocuments({ user_id: userId, deleted_at: null, status: { $in: ["contacted", "qualified"] } }),
      Lead.countDocuments({ user_id: userId, deleted_at: null, status: "qualified" }),
      Deal.countDocuments({ user_id: userId, status: "closed", deal_type: "won" })
    ]);

    return successResponse(res, {
      stages: [
        { name: "Leads", count: totalLeads },
        { name: "Contacted", count: contacted },
        { name: "Qualified", count: qualified },
        { name: "Won", count: wonDeals }
      ]
    });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/analytics/deal-status-breakdown
export const getDealStatusBreakdown = async (req, res) => {
  try {
    const userOid = toObjectId(req.user.id);
    const statuses = await Deal.aggregate([
      { $match: { user_id: userOid } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const breakdown = { "to-do": 0, "in-progress": 0, "negotiation": 0, "closed": 0 };
    statuses.forEach(s => { breakdown[s._id] = s.count; });

    return successResponse(res, breakdown);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
