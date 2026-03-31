import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: 255
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  company: {
    type: String,
    trim: true,
    default: ""
  },
  status: {
    type: String,
    enum: ["new", "contacted", "qualified", "lost", "deleted"],
    default: "new"
  },
  source: {
    type: String,
    enum: ["website", "referral", "event", "cold_call", "other"],
    default: "other"
  },
  notes: {
    type: String,
    default: ""
  },
  deleted_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

// Compound indexes
leadSchema.index({ user_id: 1, status: 1 });
leadSchema.index({ user_id: 1, created_at: -1 });
leadSchema.index({ email: 1 }, { unique: true });

// Exclude soft-deleted by default
leadSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted_at: null });
  } else {
    delete this.getQuery().includeDeleted;
  }
});

export default mongoose.model("Lead", leadSchema);
