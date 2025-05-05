const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  socket.on("join", ({ userId }) => {
    socket.join(userId);
    console.log(`✅ User ${userId} joined room`);
  });

  socket.on("incomingCall", (data) => {
    const { toUserId } = data;
    console.log(`📞 Incoming call to ${toUserId}`);
    io.to(toUserId).emit("incomingCall", data);
  });

  socket.on("declineCall", ({ toUserId, fromUserId, fromName }) => {
    io.to(toUserId).emit("callDeclined", {
      fromUserId,
      fromName,
    });
  });
  socket.on("callAccepted", ({ toUserId }) => {
    console.log(`✅ Call accepted, notifying ${toUserId}`);
    io.to(toUserId).emit("callAccepted");
  });

  socket.on("endCall", ({ toUserId }) => {
    console.log(`📴 Call ended, notifying ${toUserId}`);
    io.to(toUserId).emit("callEnded");
  });
  

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`🚀 Call-service listening on port ${PORT}`);
});
