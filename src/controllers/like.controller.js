const { likeService } = require("../services");

const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/customError");

const handleLike = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    console.log("User authenticated", req.body);
    const { postId } = req.body;
    if (!postId) {
      throw new BadRequestError("Missing post ID", {
        message: "Missing post ID",
      });
    }
    const { message } = await likeService.handleLike(userId, postId);
    console.log("Message", message);
    res.status(201).json({ message });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { handleLike };
