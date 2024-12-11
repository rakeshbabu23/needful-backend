require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const http = require("http");
const { io } = require("../routes/sockets/socket.route");

const { errorMiddleware } = require("../middlewares/error.middleware");
const { corsOptionsDelegate } = require("../config/cors.config");

//ROUTES

const authRoutes = require("../routes/auth.route");
const userRoutes = require("../routes/user.route");
const postRoutes = require("../routes/post.route");
const likeRoutes = require("../routes/like.route");
const commentRoutes = require("../routes/comment.route");
const messageRoutes = require("../routes/message.route");

const corsOptions = {
  origin: "http://192.168.248.172:3000", // Frontend URL
  credentials: true, // Allow sending credentials (cookies)
};
const PORT = process.env.PORT || 8000;

const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CORS
  app.use(cors(corsOptions));

  // Routes
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/post", postRoutes);
  app.use("/like", likeRoutes);
  app.use("/comment", commentRoutes);
  app.use("/messages", messageRoutes);

  app.use(errorMiddleware);
  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
  // Socket.io setup
  io.attach(server);
  app.io = io;
};

module.exports = { createApp };
