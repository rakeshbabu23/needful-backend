const { postService } = require("../services");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/CustomError");

const createPost = async (req, res, next) => {
  try {
    console.log("qqqqqqqqqqqq");
    const { userId } = req.cookies;
    console.log("Creating", req.body);
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const files = req.files;
    console.log("Files", `userId:${userId}`);
    req.app.io.to(`userId:${userId}`).emit({ postStatus: "loading" });
    const newPost = await postService.createPost(userId, req.body, files);
    req.app.io.to(`userId:${userId}`).emit({ postStatus: "completed" });
    console.log(newPost);
    res
      .status(201)
      .json({ message: "Post created successfully", data: newPost });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getPosts = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { filter } = req.query;
    const { images, videos, texts, totalPosts } = await postService.getPosts(
      userId,
      req.query,
      page,
      limit
    );
    res.status(200).json({
      data:
        req.query.postType === "text"
          ? texts
          : req.query.postType === "image"
          ? images
          : req.query.postType === "video"
          ? videos
          : {
              images,
              videos,
              texts,
            },
    });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const postId = req.params.postId;
    const { post, comments } = await postService.getPostById(userId, postId);
    if (!post) {
      throw new NotFoundError("Post not found");
    }
    res.status(200).json({ data: { post, comments } });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const deletePost = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const { postId } = req.params;
    await postService.deletePost(userId, postId);
    res.status(204).json({ message: "Post deleted successfully" });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const likePost = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const { postId } = req.body;
    await postService.likePost(userId, postId);
    res.status(200).json({ message: "Post liked successfully" });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const addCommentToPost = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const { postId } = req.body;
    const comment = req.body.comment;
    if (!comment) {
      throw new BadRequestError("Comment is required", {
        message: "Comment is required",
      });
    }
    await postService.addCommentToPost(userId, postId, comment);
    res.status(201).json({ message: "Comment added successfully" });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  deletePost,
  likePost,
  addCommentToPost,
};
