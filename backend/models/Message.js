import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ["user", "bot", "agent", "system"],
    required: true
  },
  sender_name: {
    type: String,
    default: ""
  },
  content: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ["text", "system", "image", "file"],
    default: "text"
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: false }
});

messageSchema.index({ conversation_id: 1, created_at: 1 });

export default mongoose.model("Message", messageSchema);
