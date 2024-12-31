const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { authController } = require("../controllers");
router.post(
  "/create",
  upload.single("profileImage"),
  authController.createUserWithFirebaseToken
);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOTPToEmail);
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
