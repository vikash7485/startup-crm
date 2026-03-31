import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  activity_type: {
    type: String,
    enum: ["lead_created", "lead_updated", "lead_deleted", "lead_contacted",
           "deal_created", "deal_updated", "deal_status_changed", "deal_closed"],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  related_entity: {
    type: String,
    default: ""
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: false }
});

activitySchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model("Activity", activitySchema);
