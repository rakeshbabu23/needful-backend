const { Comment, Post } = require("../models");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
  APIError,
} = require("../lib/customError");

const createComment = async (userId, postId, commentText) => {
  console.log("in create comment service", postId, userId, commentText);
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  try {
    const newComment = new Comment({ postId, userId, text: commentText });
    await newComment.save();
    await newComment.populate({ path: "userId", select: "-password" });
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });
    return newComment;
  } catch (error) {
    throw new InternalServerError("An error occrued", error.message);
  }
};

const getCommentsOfPost = async (postId, page) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  const comments = await Comment.find({ postId })
    .populate({ path: "userId", select: "-password" })
    .sort({ createdAt: -1 })
    .limit(100)
    .skip((page - 1) * 100);
  return comments;
};

module.exports = {
  createComment,
  getCommentsOfPost,
};
