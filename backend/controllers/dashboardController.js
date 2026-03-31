import mongoose from "mongoose";
import Lead from "../models/Lead.js";
import Deal from "../models/Deal.js";
import Activity from "../models/Activity.js";
import { successResponse, errorResponse } from "../services/utils/responseHelper.js";

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(userId) {
  for (const key of cache.keys()) {
    if (key.startsWith(`stats_`)) cache.delete(key);
  }
}

function toObjectId(id) {
  try { return new mongoose.Types.ObjectId(id); } catch { return id; }
}

// GET /api/dashboard/stats
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `stats_${userId}`;
    const cached = getCached(cacheKey);
    if (cached) return successResponse(res, cached);

    const userOid = toObjectId(userId);

    const [total_leads, deals_in_pipeline, won_deals, revenueAgg] = await Promise.all([
      Lead.countDocuments({ user_id: userId, deleted_at: null }),
      Deal.countDocuments({ user_id: userId, status: { $in: ["to-do", "in-progress", "negotiation"] } }),
      Deal.countDocuments({ user_id: userId, status: "closed", deal_type: "won" }),
      Deal.aggregate([
        { $match: { user_id: userOid, status: "closed", deal_type: "won" } },
        { $group: { _id: null, total: { $sum: "$value" } } }
      ])
    ]);

    const stats = {
      total_leads,
      deals_in_pipeline,
      won_deals,
      revenue: revenueAgg[0]?.total || 0,
      last_updated: new Date().toISOString()
    };

    setCache(cacheKey, stats);
    return successResponse(res, stats);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/dashboard/activities
export const getActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const [activities, total] = await Promise.all([
      Activity.find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Activity.countDocuments({ user_id: userId })
    ]);

    return successResponse(res, { activities, total, limit, offset });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// GET /api/dashboard/sales-metrics
export const getSalesMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userOid = toObjectId(userId);
    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const monthlyRevenue = await Deal.aggregate([
      {
        $match: {
          user_id: userOid,
          status: "closed",
          deal_type: "won",
          updated_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$updated_at" } },
          revenue_value: { $sum: "$value" },
          deals_count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthlyLeads = await Lead.aggregate([
      {
        $match: {
          user_id: userOid,
          created_at: { $gte: startDate },
          deleted_at: null
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
          leads_count: { $sum: 1 }
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
      const rev = monthlyRevenue.find(r => r._id === key);
      const leads = monthlyLeads.find(l => l._id === key);
      const dealsCount = rev?.deals_count || 0;
      const leadsCount = leads?.leads_count || 0;
      const conversionRate = leadsCount > 0 ? Math.round((dealsCount / leadsCount) * 10000) / 100 : 0;

      results.push({
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        month_key: key,
        revenue_value: rev?.revenue_value || 0,
        deals_count: dealsCount,
        leads_count: leadsCount,
        conversion_rate: conversionRate
      });
    }

    return successResponse(res, results);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
