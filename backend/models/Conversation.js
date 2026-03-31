import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  status: {
    type: String,
    enum: ["open", "waiting_for_agent", "agent_connected", "closed"],
    default: "open"
  },
  tags: [{
    type: String,
    enum: ["lead", "customer", "issue", "general", "billing", "technical"]
  }],
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  last_message: {
    type: String,
    default: ""
  },
  unread_count: {
    type: Number,
    default: 0
  },
  user_name: { type: String, default: "" },
  user_email: { type: String, default: "" },
  resolved_at: { type: Date, default: null },
  first_response_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

conversationSchema.index({ status: 1, updated_at: -1 });
conversationSchema.index({ agent_id: 1, status: 1 });

export default mongoose.model("Conversation", conversationSchema);
