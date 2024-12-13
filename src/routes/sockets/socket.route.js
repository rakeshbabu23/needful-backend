const { messageService } = require("../../services");

const io = require("socket.io")();

function getRoomName(userId1, userId2) {
  return [userId1, userId2].sort().join("_");
}
const userSocketMap = {};
io.on("connection", (socket) => {
  console.log("socket connection made");
  socket.on("on_user_login", ({ userId }) => {
    console.log("user logged in", `userId:${userId}`);
    socket.join(`userId:${userId}`);
  });
  socket.on("register_user", ({ userId }) => {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} registered with socket ID ${socket.id}`);
  });
  socket.on("join_room", ({ senderId, receiverId }) => {
    const roomName = getRoomName(senderId, receiverId);
    console.log("Room", roomName);
    socket.join(roomName);
  });
  socket.on("send_message", async ({ senderId, receiverId, chatId, text }) => {
    console.log("send", senderId, receiverId, chatId, text);
    const roomName = getRoomName(senderId, receiverId);
    const message = await messageService.sendMessage(
      senderId,
      receiverId,
      chatId,
      text
    );
    io.to(roomName).emit("new_message", message);
  });
  socket.on(
    "get_older_messages",
    async ({ senderId, receiverId, chatId, pageToFetch }) => {
      console.log(
        "get_older_messages",
        senderId,
        receiverId,
        chatId,
        pageToFetch
      );

      const roomName = getRoomName(senderId, receiverId);
      const { messages, chatId: chatID } = await messageService.getMessages(
        senderId,
        receiverId,
        chatId,
        pageToFetch
      );

      io.to(roomName).emit("older_messages", { messages, chatId: chatID });
    }
  );
  socket.on(
    "fetch_recent_messages",
    async ({ senderId, receiverId, chatId, pageToFetch }) => {
      console.log(
        "fetch_recent_messages",
        senderId,
        receiverId,
        chatId,
        pageToFetch
      );

      const roomName = getRoomName(senderId, receiverId);
      const { messages, chatId: chatID } = await messageService.getMessages(
        senderId,
        receiverId,
        chatId,
        pageToFetch
      );

      io.to(roomName).emit("recent_messages", { messages, chatId: chatID });
    }
  );

  socket.on("user_online_status", ({ roomName, userId, receiverId }) => {
    const socketId = userSocketMap[receiverId];
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room && socketId && room.has(socketId)) {
      io.to(userSocketMap[userId]).emit("user_in_room", {
        roomName,
        receiverId,
        isPresent: true,
      });
    } else {
      io.to(userSocketMap[userId]).emit("user_in_room", {
        roomName,
        receiverId,
        isPresent: false,
      });
    }
  });

  socket.on("leave_room", ({ roomName }) => {
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room ${roomName}`);
  });
  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    for (const [userId, socketId] of Object.entries(userSocketMap)) {
      if (socketId === socket.id) {
        delete userSocketMap[userId];
        console.log(`User ${userId} disconnected from socket ID ${socketId}`);
        break;
      }
    }
  });
});

module.exports = { io };
