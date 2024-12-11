const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // gender: {
    //   type: String,
    //   enum: ["Male", "Female", "Other"],
    //   required: true,
    // },
    // dob: {
    //   type: String,
    //   required: true,
    // },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    visibility: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index specifically on location
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
