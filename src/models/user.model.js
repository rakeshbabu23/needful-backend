const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip hashing if the password hasn't changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
