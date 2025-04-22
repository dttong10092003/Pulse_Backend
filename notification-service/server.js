const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const notificationRoute = require('./routes/notificationRoutes');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    ssl: true,
    tlsAllowInvalidCertificates: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('Notification Service is running...');
});

app.use('/', notificationRoute); // mount route gốc

const PORT = process.env.PORT || 5005;


const http = require('http');
const { Server } = require('socket.io');

// Tạo server từ express app
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép frontend kết nối
  }
});

// Gắn io vào app để dùng ở controller
app.set("io", io);

// Lắng nghe kết nối từ client
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join_user", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their personal room`);
  });
});

// ⚠️ Đổi từ app.listen sang server.listen
server.listen(PORT, () => {
  console.log(`🚀 Notification Service is running on port ${PORT}`);
});


