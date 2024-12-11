const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tags: {
      type: [String],
    },
    text: {
      type: String,
    },
    media: {
      images: [
        {
          imageUrl: {
            type: String,
          },
          aspectRatio: {
            type: String,
          },
        },
      ],
      videos: [
        {
          videoUrl: {
            type: String,
          },
          thumbUrl: {
            type: String,
          },
          aspectRatio: {
            type: String,
          },
        },
      ],
    },
    expiresIn: {
      type: Number,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: [Number],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
postSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("Post", postSchema);
