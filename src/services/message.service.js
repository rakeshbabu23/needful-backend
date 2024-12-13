const { Chat, Message, User } = require("../models");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
  NotFoundError,
} = require("../lib/customError");

const sendMessage = async (senderId, receiverId, chatId, text) => {
  const sender = await User.findById(senderId);
  if (!sender) {
    throw new NotFoundError("Sender not found", {
      message: "Sender not found",
    });
  }
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new NotFoundError("Receiver not found", {
      message: "Receiver not found",
    });
  }
  let chat = null;
  if (!chatId) {
    chat = await isChatExists(senderId, receiverId);
    chat.lastMessage = text;
    chat.lastMessageTimestamp = new Date();
    await chat.save();
  } else {
    chat = await Chat.findById(chatId);
    if (!chat) {
      throw new NotFoundError("Chat not found", {
        message: "Chat not found",
      });
    }
    chat.lastMessage = text;
    chat.lastMessageTimestamp = new Date();
    await chat.save();
  }
  const message = new Message({ senderId, receiverId, text, chatId: chat._id });
  await message.save();
  return message;
};
const getMessages = async (senderId, receiverId, chatId, page) => {
  const sender = await User.findById(senderId);
  if (!sender) {
    throw new NotFoundError("Sender not found", {
      message: "Sender not found",
    });
  }
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new NotFoundError("Receiver not found", {
      message: "Receiver not found",
    });
  }
  let chat = null;
  if (!chatId) {
    chat = await isChatExists(senderId, receiverId);
  }
  const messages = await Message.find({ chatId: chat._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * 80)
    .limit(80);
  return { messages, chatId: chat._id };
};

const getExistingChats = async (userId) => {
  const chats = await Chat.find({
    participants: { $in: [userId] },
    lastMessage: { $ne: "" },
  })
    .sort({ createdAt: -1 }) // Fixed sort block
    .lean(); // Converts Mongoose documents to plain JavaScript objects

  // Fetch all user details in one go to avoid multiple queries
  const userIds = [
    ...new Set(
      chats.map((chat) =>
        chat.participants.find(
          (participant) => participant.toString() !== userId.toString()
        )
      )
    ),
  ];

  const users = await User.find({ _id: { $in: userIds } }).select("-password");
  const userMap = users.reduce((acc, user) => {
    acc[user._id.toString()] = user;
    return acc;
  }, {});

  // Add receiver details to each chat
  const updatedChats = chats.map((chat) => {
    const receiverId = chat.participants.find(
      (participant) => participant.toString() !== userId.toString()
    );
    return {
      ...chat,
      receiverDetails: userMap[receiverId],
    };
  });

  return updatedChats;
};

const isChatExists = async (senderId, receiverId) => {
  let chat = null;
  chat = await Chat.findOne({
    participants: { $all: [senderId, receiverId] },
  });
  if (!chat) {
    chat = await Chat.create({
      participants: [senderId, receiverId],
    });
    return chat;
  } else {
    return chat;
  }
};

module.exports = { sendMessage, getMessages, getExistingChats };
