const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:4000", "https://pulse-azure.vercel.app", "https://testz-six.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const activeCallUsers = new Map();

io.on("connection", (socket) => {
  console.log(`📡 Client connected: ${socket.id}`);

  socket.on("join", ({ userId }) => {
    socket.join(userId);
    console.log(`✅ User ${userId} joined room`);
  });
 // ✅ Nhận thông tin người mới tham gia call
 socket.on("userJoinedCall", (userInfo) => {
  // Lưu thông tin người dùng
  activeCallUsers.set(socket.id, userInfo);

  // Gửi thông tin này đến tất cả người khác (trừ bản thân)
  socket.broadcast.emit("userJoinedCall", userInfo);

  // Gửi danh sách người đã có mặt trước đó cho người mới
  const others = Array.from(activeCallUsers.values()).filter(
    (user) => user.uid !== userInfo.uid
  );
  socket.emit("existingUsersInCall", others);
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
    activeCallUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`🚀 Call-service listening on port ${PORT}`);
});
