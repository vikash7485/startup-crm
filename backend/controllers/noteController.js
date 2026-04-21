import Note from "../models/Note.js";
import Lead from "../models/Lead.js";
import { successResponse, errorResponse } from "../services/utils/responseHelper.js";

// GET /api/notes/:leadId
export const getNotesByLead = async (req, res) => {
  try {
    const query = { leadId: req.params.leadId };
    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }

    const notes = await Note.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, notes);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// POST /api/notes
export const createNote = async (req, res) => {
  try {
    const { leadId, content } = req.body;
    
    // Check access to Lead
    const leadQuery = { _id: leadId, deleted_at: null };
    if (req.user.role !== "admin") leadQuery.user_id = req.user.id;
    
    const lead = await Lead.findOne(leadQuery);
    if (!lead) return errorResponse(res, "Lead not found or access denied", 404, "NOT_FOUND");

    const note = await Note.create({ leadId, userId: req.user.id, content });
    
    // Populate before return
    const populatedNote = await Note.findById(note._id).populate("userId", "name email");
    return successResponse(res, populatedNote, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// PUT /api/notes/:id
export const updateNote = async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { content },
      { new: true }
    ).populate("userId", "name email");

    if (!note) return errorResponse(res, "Note not found or you are not the author", 404, "NOT_FOUND");
    return successResponse(res, note);
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") query.userId = req.user.id;
    
    const deleted = await Note.findOneAndDelete(query);
    if (!deleted) return errorResponse(res, "Note not found or access denied", 404, "NOT_FOUND");
    
    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, error.message, 500, "SERVER_ERROR");
  }
};
