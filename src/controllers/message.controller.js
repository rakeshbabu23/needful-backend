const { messageService } = require("../services");
const {
  ValidationError,
  UnauthorizedError,
  InternalServerError,
  ForbiddenError,
  BadRequestError,
  APIError,
} = require("../lib/customError");
const sendMessage = async (req, res, next) => {
  try {
    const { senderId, receiverId, chatId, text } = req.body;
    if (!senderId || !receiverId) {
      throw new ValidationError("Missing sender or receiver id");
    }
    const message = await messageService.sendMessage(
      senderId,
      receiverId,
      chatId,
      text
    );
    res.status(201).json({ data: message });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};
const getMessages = async (req, res, next) => {
  try {
    const { senderId, receiverId, chatId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const messages = await messageService.getMessages(
      senderId,
      receiverId,
      chatId,
      page
    );
    res.status(200).json({ data: messages });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

const getExistingChats = async (req, res, next) => {
  try {
    const { userId } = req.cookies;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    const chats = await messageService.getExistingChats(userId);
    res.status(200).json({ data: chats });
  } catch (e) {
    if (e instanceof APIError) {
      return next(e);
    }
    return next(new InternalServerError(e.message));
  }
};

module.exports = { sendMessage, getMessages, getExistingChats };
