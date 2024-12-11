const mongoose = require("mongoose");
const axios = require("axios");
const { User, Session, Post } = require("../models");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
  APIError,
} = require("../lib/customError");
const { uploadProfilePicture } = require("../utils/s3.util");
const { range } = require("../constants/diatance");
const { extractCity } = require("../utils/reverseGeocoding.util");

const updateUser = async (userId, userInfo, file) => {
  console.log("in update user servce", userInfo);
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  try {
    if (file) {
      const profilePictureUrl = await uploadProfilePicture(
        file,
        userId,
        "profile-pictures"
      );
      userInfo.profileImage = profilePictureUrl;
    }
    if (userInfo.email) {
      const existingUser = await User.findOne({ email: userInfo.email });
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new ForbiddenError("Email already in use");
      }
    }
    if (userInfo.userLocation) {
      const sanitizedCoordinates = userInfo.userLocation
        .replace(/[\[\]']/g, "") // Remove brackets and single quotes
        .split(",") // Split by comma
        .map(Number); // Convert to numbers
      userInfo.location = {
        type: "Point",
        coordinates: sanitizedCoordinates,
      };
    }
  } catch (error) {
    throw new APIError(error);
  }
  Object.assign(user, userInfo);
  try {
    const updatedUser = await user.save();
    return updatedUser;
  } catch (error) {
    throw new InternalServerError("Failed to update user", error);
  }
};

const getUserInfo = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
};
const nearbyPeople = async (userId, filters = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const nearByUsers = await User.aggregate([
    {
      $geoNear: {
        near: user.location,
        distanceField: "distance",
        maxDistance: range[filters.maxDistance],
        spherical: true,
        query: {
          visibility: true,
        },
      },
    },
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        profileImage: 1,
        location: 1,
        address: 1,
        distance: 1,
      },
    },
  ]);
  const updatedUsers = nearByUsers.map((user) => {
    return {
      receiverDetails: user,
    };
  });

  return updatedUsers;
};

const getUserCurrentLocation = async ({ lat, long }) => {
  console.log("Getting", lat, long);
  let address = "";
  try {
    const options = {
      method: "GET",
      url: `https://us1.locationiq.com/v1/reverse?lat=${lat}&lon=${long}&key=pk.b947b52cdc557100cbb97527d1289281`,
      headers: { accept: "application/json" },
    };
    const response = await axios.request(options);
    address = await extractCity(response.data);
    return address;
  } catch (err) {
    console.error("Error fetching address", err.message);
    throw err;
  }
};

const userPosts = async (userId, filters, page) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  console.log("User", filters);
  let query = { owner: userId };
  if (filters?.postType) {
    if (filters.postType === "Texts") {
      query.text = { $exists: true };
      query["media.images"] = { $size: 0 };
      query["media.videos"] = { $size: 0 };
    } else if (filters.postType === "Images") {
      query["media.images"] = { $exists: true, $ne: [] };
      query["media.videos"] = { $size: 0 };
    } else if (filters.postType === "Videos") {
      query["media.videos"] = { $exists: true, $ne: [] };
      query["media.images"] = { $size: 0 };
    }
  }
  const posts = await Post.find(query)
    .populate({ path: "owner", select: "-password" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * 10)
    .limit(10);
  const updatedPosts = posts.map((post) => {
    const postObject = post.toObject(); // Convert to plain JS object if using Mongoose
    postObject.ownerDetails = postObject.owner; // Rename 'owner' to 'ownerDetails'
    delete postObject.owner; // Remove the original 'owner' field
    return postObject;
  });
  console.log("--------------------------------", updatedPosts);

  return updatedPosts;
};

const getNearbyTags = async (userId, filters) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found", {
      message: "User not found",
    });
  }

  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: user.location.coordinates },
        distanceField: "dist.calculated",
        maxDistance: range[filters.maxDistance] || 10000,
        spherical: true,
      },
    },
  ];
  const posts = await Post.aggregate(pipeline);
  const uniqueTags = [...new Set(posts.flatMap((post) => post.tags))];
  return uniqueTags;
};

const logout = async (userId) => {
  const session = await Session.findOne({ userId });
  if (!session) {
    throw new UnauthorizedError("Session not found");
  }
  await Session.deleteOne({ userId });
  return;
};
module.exports = {
  updateUser,
  getUserInfo,
  logout,
  nearbyPeople,
  getUserCurrentLocation,
  userPosts,
  getNearbyTags,
};
