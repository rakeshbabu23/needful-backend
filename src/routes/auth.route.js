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

module.exports = router;
