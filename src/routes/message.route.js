const express = require("express");
const multer = require("multer");
const router = express.Router();
const { messageController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
router.post("/", authMiddleware.verifyToken, messageController.sendMessage);
router.get("", authMiddleware.verifyToken, messageController.getMessages);
router.get(
  "/chats",
  authMiddleware.verifyToken,
  messageController.getExistingChats
);

module.exports = router;
