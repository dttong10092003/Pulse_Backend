const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const notificationRoute = require('./routes/notificationRoutes');
const http = require('http'); // Thêm dòng này
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid'); 

dotenv.config();

const app = express();
app.use(express.json());

// Tạo server HTTP từ app Express
const server = http.createServer(app); // Thêm dòng này

mongoose.connect(process.env.MONGODB_URI, {
    ssl: true,
    tlsAllowInvalidCertificates: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Notification Service is running...');
});

app.use('/', notificationRoute);

const io = socketIo(server, {
  cors: {
    origin: "*",  // Cho phép tất cả các nguồn
    methods: ["GET", "POST"]
  }
});

// Lưu trữ các kết nối socket
const socketConnections = {};

// Khi người dùng kết nối
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Lắng nghe sự kiện khi người dùng đăng nhập và gửi ID
  socket.on("user_id", (userId) => {
    socketConnections[userId] = socket;  // Lưu socket theo ID người dùng
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
  });

  // Lắng nghe sự kiện gửi thông báo
  socket.on("send_notification", (data) => {
    console.log(`Sending notification from ${data.senderId} to ${data.receiverId}`);
    
    // Kiểm tra xem người nhận có đang kết nối không
    if (socketConnections[data.receiverId]) {
      socketConnections[data.receiverId].emit("new_notification", data); // Phát thông báo cho người nhận
      console.log(`Notification sent to ${data.receiverId}`);
    } else {
      console.log(`Receiver ${data.receiverId} not connected`);
    }
  });

  // Khi người dùng ngắt kết nối
  socket.on("disconnect", () => {
    for (let userId in socketConnections) {
      if (socketConnections[userId] === socket) {
        delete socketConnections[userId]; // Xóa người dùng khỏi kết nối
        console.log(`User ${userId} disconnected`);
      }
    }
  });
});

// Khởi động server ở cổng 5007
const PORT = process.env.PORT || 5007;
server.listen(PORT, () => {
  console.log(`🚀 Notification Service is running on port ${PORT}`);
});
