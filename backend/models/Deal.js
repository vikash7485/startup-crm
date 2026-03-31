import mongoose from "mongoose";

const dealSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: [true, "Lead is required"],
    index: true
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: 255
  },
  value: {
    type: Number,
    required: [true, "Deal value is required"],
    min: [0, "Value must be >= 0"]
  },
  status: {
    type: String,
    enum: ["to-do", "in-progress", "negotiation", "closed"],
    default: "to-do"
  },
  deal_type: {
    type: String,
    enum: ["won", "lost", "pending"],
    default: "pending"
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  expected_close_date: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ""
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

// Compound indexes
dealSchema.index({ user_id: 1, status: 1 });
dealSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model("Deal", dealSchema);
