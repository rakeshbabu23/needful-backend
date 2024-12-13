const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const { userController } = require("../controllers");
const { authMiddleware } = require("../middlewares");
router.post("/logout", authMiddleware.verifyToken, userController.logout);
router.patch(
  "/",
  authMiddleware.verifyToken,
  upload.single("file"),
  userController.updateUser
);
router.get("/nearby", authMiddleware.verifyToken, userController.nearbyPeople);
router.get(
  "/current-location",
  authMiddleware.verifyToken,
  userController.userCurrentLocation
);
router.get("/", authMiddleware.verifyToken, userController.getUserInfo);
router.post("/", authMiddleware.verifyToken, userController.logout);
router.get("/posts", authMiddleware.verifyToken, userController.userPosts);
router.get("/tags", authMiddleware.verifyToken, userController.getNearbyTags);

module.exports = router;
