require("dotenv").config();
const { createApp } = require("./src/app/app");
const { Connect } = require("./src/lib/db");

// Port

// App
Connect().then(() => {
  console.log("Database connected successfully");
});
try {
  const app = createApp();
} catch (error) {
  process.exit(1);
}
// Listener
