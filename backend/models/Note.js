import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Note", noteSchema);
