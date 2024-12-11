const moment = require("moment");

const { User, Post, Like, Comment } = require("../models");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
  NotFoundError,
} = require("../lib/customError");
const { uploadFilesToS3 } = require("../utils/s3.util");
const { range } = require("../constants/diatance");

const createPost = async (userId, postInfo, files) => {
  const user = await User.findById(userId);
  console.log("qqqqqqqqqqqqqqqqqq", postInfo);
  if (!user) {
    throw new NotFoundError("User not found", {
      message: "User not found",
    });
  }
  let mediaFiles = [];
  if (files.length > 0) {
    try {
      mediaFiles = await uploadFilesToS3(files, userId, "posts");
    } catch (error) {
      throw new BadRequestError("Failed to upload files to S3", error);
    }
  }
  console.log("================================", mediaFiles);
  let images = [],
    videos = [];
  mediaFiles.map((mediaFile, index) => {
    if (mediaFile.type === "image") {
      images.push({
        imageUrl: mediaFile.imageUrl,
        aspectRatio: String(postInfo[`aspectRatio_${index}`]),
      });
    } else {
      videos.push({
        videoUrl: mediaFile.videoUrl,
        thumbnailUrl: mediaFile.thumbnailUrl,
        aspectRatio: mediaFile.aspectRatio,
      });
    }
  });

  const post = new Post({
    owner: userId,
    content: postInfo.content,
    media: {
      images: images,
      videos: videos,
    },
    location: {
      type: "Point",
      coordinates: user.location.coordinates,
    },
    expiresIn: postInfo.expiresIn,
    text: postInfo.text,
    tags: postInfo.tags,
  });
  try {
    await post.save();
    return post;
  } catch (error) {
    throw new InternalServerError("Failed to create post", error);
  }
};

const getPosts = async (userId, filters, page = 1, limit = 10) => {
  console.log("GET POSTTTTTTTTTTTTTTTTT", page, limit);
  //console.log("GET POST FILTERS", typeof JSON.parse(filters.tags));
  // Fetch user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found", {
      message: "User not found",
    });
  }

  const query = { isDeleted: false };

  // Filter by tags
  if (filters?.tags && filters?.tags?.length > 0) {
    query.tags = { $in: [...JSON.parse(filters.tags), ""] };
  }

  // Handle `expiresIn` filter
  query.$or = [
    { expiresIn: { $exists: false } },
    {
      $expr: {
        $gte: [
          "$createdAt",
          {
            $subtract: [
              new Date(),
              { $multiply: ["$expiresIn", 60 * 60 * 1000] }, // Convert hours to milliseconds
            ],
          },
        ],
      },
    },
  ];

  // Filter by post type
  if (filters?.postType) {
    if (filters.postType === "text") {
      query.text = { $exists: true };
      query["media.images"] = { $size: 0 };
      query["media.videos"] = { $size: 0 };
    } else if (filters.postType === "image") {
      query["media.images"] = { $exists: true, $ne: [] };
      query["media.videos"] = { $size: 0 };
    } else if (filters.postType === "video") {
      query["media.videos"] = { $exists: true, $ne: [] };
      query["media.images"] = { $size: 0 };
    }
  }

  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: user.location.coordinates },
        distanceField: "dist.calculated",
        distanceMultiplier: 6371,
        maxDistance: range[filters?.maxDistance] || 10000,
        spherical: true,
        query,
      },
    },
    {
      $lookup: {
        from: "users", // The name of the User collection in MongoDB
        localField: "owner", // The field in the Post collection
        foreignField: "_id", // The field in the User collection
        as: "ownerDetails", // The name of the new field to store the owner's details
      },
    },
    {
      $unwind: {
        path: "$ownerDetails",
        preserveNullAndEmptyArrays: true, // Set to true if posts might not have an owner
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort posts by creation date (newest first)
    },
    {
      $skip: (page - 1) * limit, // Skip records for pagination
    },
    {
      $limit: limit, // Limit the number of records per page
    },
    {
      $project: {
        _id: 1,
        text: 1,
        media: 1,
        location: 1,
        createdAt: 1,
        views: 1,
        likes: 1,
        comments: 1,
        "dist.calculated": 1,
        "ownerDetails._id": 1,
        "ownerDetails.name": 1,
        "ownerDetails.email": 1,
        "ownerDetails.profileImage": 1, // Add any other user fields you want
      },
    },
  ];

  const posts = await Post.aggregate(pipeline);
  const updatedPosts = await Promise.all(
    posts.map(async (post) => {
      const checkedUserLiked = await Like.findOne({
        userId: userId,
        postId: post._id,
      });
      if (checkedUserLiked) {
        post.isUserLiked = true;
      } else {
        post.isUserLiked = false;
      }
      return post;
    })
  );
  const images = [],
    texts = [],
    videos = [];
  updatedPosts.forEach((post) => {
    if (post?.media?.images?.length > 0) {
      images.push(post);
    } else if (post?.media?.videos?.length > 0) {
      videos.push(post);
    } else {
      texts.push(post);
    }
  });
  return {
    images,
    texts,
    videos,
    totalPosts: updatedPosts.length,
    totalImages: images.length,
    totalTexts: texts.length,
    totalVideos: videos.length,
  };
  // console.log("posts", posts);
  // return posts;
};

const deletePost = async (userId, postId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found", {
      message: "User not found",
    });
  }
  const post = await Post.findById(postId);
  if (!post || post.userId.toString() !== userId.toString()) {
    throw new ForbiddenError("You don't have permission to delete this post");
  }
  try {
    post.isDeleted = true;
    await post.save();
  } catch (error) {
    throw new InternalServerError("Failed to delete post", error);
  }
};

const likePost = async (userId, postId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found", {
      message: "User not found",
    });
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  const checkedUserLiked = await Like.findOne({
    userId: userId,
    postId: postId,
  });
  if (checkedUserLiked) {
    await Like.deleteOne({
      userId: userId,
      postId: postId,
    });
    post.likes -= 1;
    return;
  } else {
    const like = new Like({ userId, postId });
    await like.save();
    post.likes += 1;
  }
  try {
    await post.save();
  } catch (error) {
    throw new InternalServerError("Failed to like post", error);
  }
};

const addCommentToPost = async (userId, postId, text) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found", {
      message: "User not found",
    });
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  const comment = new Comment({ userId, postId, text });
  try {
    await comment.save();
    post.comments += 1;
    await post.save();
    return comment;
  } catch (error) {
    throw new InternalServerError("Failed to add comment to post", error);
  }
};

const getPostInfo = async (userId, postId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found", {
      message: "User not found",
    });
  }
  const post = await Post.findById(postId).select("-location");
  if (!post) {
    throw new NotFoundError("Post not found");
  }
  const comments = await Comment.find({ postId: postId }).populate({
    path: "userId",
    select: "name photoImage",
  });
  return {
    post,
    comments,
  };
};

module.exports = {
  createPost,
  getPosts,
  deletePost,
  likePost,
  addCommentToPost,
  getPostInfo,
};
