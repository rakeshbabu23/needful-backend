const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { postController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
router.post(
  "/create",
  authMiddleware.verifyToken,
  upload.array("files"),
  postController.createPost
);
router.get("/", authMiddleware.verifyToken, postController.getPosts);
router.get("/:postId", authMiddleware.verifyToken, postController.getPostById);
router.post("/like", authMiddleware.verifyToken, postController.likePost);
router.delete(
  "/:postId",
  authMiddleware.verifyToken,
  postController.deletePost
);
router.post(
  "/comment",
  authMiddleware.verifyToken,
  postController.addCommentToPost
);

module.exports = router;
