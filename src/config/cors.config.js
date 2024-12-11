require("dotenv").config();

// Unused
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200,
  credentials: true,
};

const allowList = [
  process.env.FRONTEND_URL,
  "https://onelyk.com",
  "https://www.onelyk.com",
  "https://testhotel.onelyk.com",
  "http://localhost:3000",
  "https://4ckpq2tm-3000.inc1.devtunnels.ms",
  "https://8l4qkmp2-8000.inc1.devtunnels.ms",
  "https://jainil.stoplight.io",
  "https://8l4qkmp2-3000.inc1.devtunnels.ms",
  "http://localhost:3001",
  "http://localhost:4000",
  "https://guest.onelyk.com",
  "http://192.168.29.39:3000",
];

const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  if (allowList.indexOf(req.header("Origin")) !== -1) {
    corsOptions = { origin: true, credentials: true };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

module.exports = { corsOptions, corsOptionsDelegate };
