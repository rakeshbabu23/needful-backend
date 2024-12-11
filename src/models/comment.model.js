const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
commentSchema.index({ userId: 1, postId: 1 });
module.exports = mongoose.model("Comment", commentSchema);
