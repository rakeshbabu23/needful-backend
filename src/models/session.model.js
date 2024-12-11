const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * @typedef {import("mongoose").Model<Session>} Session
 * @typedef {typeof Session.schema.obj} SessionType
 */
const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;
