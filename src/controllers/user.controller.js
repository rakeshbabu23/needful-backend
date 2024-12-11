const { userService } = require("../services");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/customError");
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    const file = req.file;
    console.log("i am in update uyser", req.body);
    const updatedUser = await userService.updateUser(userId, req.body, file);
    console.log("updated user", updatedUser);
    res.status(200).json({ data: updatedUser });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getUserInfo = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const user = await userService.getUserInfo(userId);
    res.status(200).json({ data: user });
  } catch (error) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const logout = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    await userService.logout(userId);
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("userId");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const nearbyPeople = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    console.log("User logged in");
    const people = await userService.nearbyPeople(userId, req.query);
    res.status(200).json({ data: people });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const userCurrentLocation = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    console.log("aaaaaaaaaaaaa", req.query);
    const { lat, long } = req.query;
    if (!lat || !long) {
      throw new BadRequestError("Missing latitude or longitude", {
        message: "Missing latitude or longitude",
      });
    }
    const userLocation = await userService.getUserCurrentLocation(req.query);
    res.status(200).json({ data: userLocation });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const userPosts = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const page = parseInt(req.query.page) || 1;
    const posts = await userService.userPosts(userId, req.query, page);

    res.status(200).json({ data: posts });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getNearbyTags = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated", {
        message: "User not authenticated",
      });
    }
    const nearbyTags = await userService.getNearbyTags(userId, req.query);
    res.status(200).json({ data: nearbyTags });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = {
  updateUser,
  getUserInfo,
  logout,
  nearbyPeople,
  userCurrentLocation,
  userPosts,
  getNearbyTags,
};
