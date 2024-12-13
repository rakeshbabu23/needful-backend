const axios = require("axios");
const { Session, User } = require("../models");
const { generateAccessToken } = require("../utils/jwt.util");
const { jwtSecret } = require("../config/config");
const { extractCity } = require("../utils/reverseGeocoding.util");
//const admin = require("../config/firebase.config");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/customError");
const { uploadProfilePicture } = require("../utils/s3.util");
function validateCoordinates(input) {
  const parts = input.split(",");
  if (parts.length === 2) {
    const [lon, lat] = parts.map(Number);
    if (!isNaN(lon) && !isNaN(lat)) {
      return [lon, lat];
    }
  }
  throw new Error("Invalid coordinates format");
}
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
const createUserWithFirebaseToken = async (
  name,
  email,
  password,
  userLocation,
  profileImage
) => {
  //const parsedLocation = validateCoordinates(userLocation);
  const checkEmailExists = await User.findOne({ email: email });
  if (checkEmailExists) {
    throw new ForbiddenError("Email already in use", {
      message: "Email already in use",
    });
  }

  let accessToken = null,
    refreshToken = null;
  const sanitizedCoordinates = userLocation
    .replace(/[\[\]']/g, "") // Remove brackets and single quotes
    .split(",") // Split by comma
    .map(Number); // Convert to numbers
  if (!checkEmailExists) {
    let address = "";
    try {
      const options = {
        method: "GET",
        url: `https://us1.locationiq.com/v1/reverse?lat=${sanitizedCoordinates[1]}&lon=${sanitizedCoordinates[0]}&key=${LOCATIONIQ_API_KEY}`,
        headers: { accept: "application/json" },
      };
      const response = await axios.request(options);
      address = await extractCity(response.data);
    } catch (err) {
      console.error("Error fetching address", err);
      throw err;
    }
    const newUser = await User.create({
      email,
      password,
      name,
      location: {
        type: "Point",
        coordinates: sanitizedCoordinates,
      },
      address,
    });
    if (profileImage) {
      const profilePictureUrl = await uploadProfilePicture(
        profileImage,
        newUser._id,
        "profile-pictures"
      );
      newUser.profileImage = profilePictureUrl;
      await newUser.save();
    }

    accessToken = generateAccessToken(
      { userId: newUser._id, email, name },
      "1d",
      process.env.JWT_ACCESS_SECRET
    );
    refreshToken = generateAccessToken(
      {
        userId: newUser._id,
        email,
        name,
      },
      "15d",
      process.env.JWT_REFRESH_SECRET
    );
    await Session.create({
      userId: newUser._id,
      refreshToken,
    });
    return { accessToken, refreshToken, user: newUser };
  } else {
    await Session.deleteOne({ userId: createUser._id });
    accessToken = generateAccessToken(
      { userId: createUser._id, email, name },
      "1d",
      process.env.JWT_ACCESS_SECRET
    );
    refreshToken = generateAccessToken(
      { userId: createUser._id, email, name },
      "15d",
      process.env.JWT_REFRESH_SECRET
    );
    await Session.create({
      userId: createUser._id,
      refreshToken,
    });
    return { accessToken, refreshToken, user: createUser };
  }
};

const login = async (email, password, location) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthorizedError("Email not found.Please sign up");
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }
  let updatedUser = null;
  try {
    const sanitizedCoordinates = location
      .replace(/[\[\]']/g, "") // Remove brackets and single quotes
      .split(",") // Split by comma
      .map(Number); // Convert to numbers
    const options = {
      method: "GET",
      url: `https://us1.locationiq.com/v1/reverse?lat=${sanitizedCoordinates[1]}&lon=${sanitizedCoordinates[0]}&key=${LOCATIONIQ_API_KEY}`,
      headers: { accept: "application/json" },
    };
    const response = await axios.request(options);
    const address = await extractCity(response.data);
    user.location = {
      type: "Point",
      coordinates: sanitizedCoordinates,
    };
    user.address = address;
    updatedUser = await user.save();
  } catch (err) {
    console.error("Error fetching address", err.response.data);
    throw err;
  }
  const accessToken = generateAccessToken(
    { userId: updatedUser._id, email, name: user.name },
    "1d",
    process.env.JWT_ACCESS_SECRET
  );
  const refreshToken = generateAccessToken(
    { userId: updatedUser._id, email, name: user.name },
    "15d",
    process.env.JWT_REFRESH_SECRET
  );
  await Session.deleteOne({ userId: updatedUser._id });
  await Session.create({ userId: updatedUser._id, refreshToken });
  console.log("Updated user");
  return { accessToken, refreshToken, user };
};

module.exports = { createUserWithFirebaseToken, login };
