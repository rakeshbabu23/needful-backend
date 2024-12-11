const mongoose = require("mongoose");

// Connect to MongoDB
const Connect = async (mongoUrl = process.env.MONGO_URL_CLUSTER) => {
  try {
    await mongoose.connect(mongoUrl);
    console.log("Connected to mongodb");
  } catch (error) {
    logger.error(error);
    process.exit(0);
  }
};

module.exports = { Connect };
