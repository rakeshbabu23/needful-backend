const { authService } = require("../services");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/customError");
const cookieOptions = require("../config/cookies.config");
const createUserWithFirebaseToken = async (req, res, next) => {
  try {
    const { name, email, password, userLocation, gender, dob } = req.body;
    const profileImage = req.file;
    const parsedLocation = JSON.parse(userLocation);
    if (!name) {
      throw new BadRequestError("Name is required", {
        message: "Name is required",
      });
    }
    if (!email) {
      throw new BadRequestError("Email is required", {
        message: "Email is required",
      });
    }
    if (!password) {
      throw new BadRequestError("Password is required", {
        message: "Password is required",
      });
    }

    const { user, accessToken, refreshToken } =
      await authService.createUserWithFirebaseToken(
        name,
        email,
        password,
        userLocation,
        profileImage
      );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    res.cookie("userId", user._id, {
      ...cookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ message: "Registered successfully", data: user });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, location } = req.body;
    if (!email) {
      throw new BadRequestError("Email is required", {
        message: "Email is required",
      });
    }
    if (!password) {
      throw new BadRequestError("Password is required", {
        message: "Password is required",
      });
    }
    const { user, accessToken, refreshToken } = await authService.login(
      email,
      password,
      location
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    res.cookie("userId", user._id, {
      ...cookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Logged in successfully", data: user });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e));
  }
};

module.exports = {
  createUserWithFirebaseToken,
  login,
};
