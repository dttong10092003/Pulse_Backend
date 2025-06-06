const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);
// const io = socketIO(server, {
//   cors: {
//     origin: "*", //sửa thành link tại vì render không cho phép *
//     // origin: ["https://testz-six.vercel.app"],
//     methods: ["GET", "POST"],
//   },
// });
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:4000", "https://pulse-azure.vercel.app", "https://testz-six.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
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

  socket.on("callAccepted", ({ toUserId, fromUserId }) => {
    console.log(`✅ Call accepted: from ${fromUserId} → to ${toUserId}`);

    // 🔁 Giữ nguyên sự kiện cũ cho Web
    io.to(toUserId).emit("callAccepted");

    // ✅ Thêm sự kiện riêng cho Mobile
    io.to(toUserId).emit("callAcceptedMobile", {
      fromUserId,
    });
  });


  socket.on("callTimeout", ({ toUserId }) => {
    console.log(`⏰ Call timeout →  ${toUserId}`);
    io.to(toUserId).emit("callTimeout");
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
