const dotenv = require("dotenv").config();
module.exports = {
  PORT: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
};
