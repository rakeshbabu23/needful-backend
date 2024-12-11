const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { commentController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
router.post("/", authMiddleware.verifyToken, commentController.createComment);
router.get(
  "/:postId",
  authMiddleware.verifyToken,
  commentController.getCommentsOfPost
);

module.exports = router;
