import Notification from "../models/Notification.js";
import { successResponse, errorResponse, paginatedResponse } from "../services/utils/responseHelper.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.user.id })
    ]);

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });

    return res.status(200).json({
      success: true,
      data: {
        items: notifications,
        unreadCount,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) return errorResponse(res, "Notification not found", 404, "NOT_FOUND");
    return successResponse(res, notification);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
