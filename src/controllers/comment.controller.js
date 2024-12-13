const { commentService } = require("../services");

const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
  APIError,
} = require("../lib/customError");

const createComment = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const { postId, content } = req.body;
    const newComment = await commentService.createComment(
      userId,
      postId,
      content
    );
    res.status(201).json({ data: newComment });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getCommentsOfPost = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const comments = await commentService.getCommentsOfPost(postId, page);
    res.status(200).json({ data: comments });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { createComment, getCommentsOfPost };
