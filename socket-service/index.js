require("dotenv").config();
const { Server } = require("socket.io");
const http = require("http");
const axios = require("axios");
const express = require("express");
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🔗 Socket connected: ", socket.id);

  socket.on("send_message", async (msg) => {
    try {
      // 1. Lưu DB qua chat-service API
      await axios.post(`${process.env.CHAT_API}/chat/sendMessage`, msg);

      // 2. Gửi tới client khác
      socket.broadcast.emit("receive_message", msg);
    } catch (err) {
      console.error("Lỗi gửi message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected: ", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 7000;
server.listen(PORT, () => {
  console.log("🚀 Socket service running on port", PORT);
});
