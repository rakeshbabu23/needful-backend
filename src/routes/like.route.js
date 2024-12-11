const express = require("express");
const multer = require("multer");
const router = express.Router();
const { likeController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
router.post("/", authMiddleware.verifyToken, likeController.handleLike);

module.exports = router;
