import mongoose from "mongoose";

const dealActivitySchema = new mongoose.Schema({
  deal_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deal",
    required: true,
    index: true
  },
  activity_type: {
    type: String,
    enum: ["status_changed", "note_added", "value_updated", "deal_created", "deal_type_changed"],
    required: true
  },
  old_value: {
    type: String,
    default: null
  },
  new_value: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: false }
});

dealActivitySchema.index({ deal_id: 1, created_at: -1 });

export default mongoose.model("DealActivity", dealActivitySchema);
