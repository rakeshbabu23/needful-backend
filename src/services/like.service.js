const { Like, Post } = require("../models");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/customError");

const handleLike = async (userId, postId) => {
  const like = await Like.findOne({ userId, postId });
  if (like) {
    try {
      await Like.deleteOne({ userId, postId });
      await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });
      return { message: "Disliked" };
    } catch (error) {
      throw new InternalServerError("An error occured", error.message);
    }
  } else {
    try {
      const newLike = new Like({ userId, postId });
      await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });
      await newLike.save();
      return { message: "Liked" };
    } catch (error) {
      throw new InternalServerError("An error occured", error.message);
    }
  }
};

module.exports = { handleLike };
