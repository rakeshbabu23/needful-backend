const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTimestamp: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
