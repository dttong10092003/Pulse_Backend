// File: server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const commentRoutes = require('./routes/commentRoutes');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Hoặc thay bằng domain frontend
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/comments', commentRoutes);

// ✅ Đổi thành đúng tên biến bạn đã khai báo
const mongoUri = process.env.MONGODB_URI;
console.log('🌐 MONGODB_URI =', mongoUri);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err.message));

// ✅ Socket.IO logic
io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  socket.on('send-comment', (data) => {
    console.log('📩 Received comment via socket:', data);
    io.emit(`receive-comment-${data.postId}`, data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5004;
server.listen(PORT, () => {
  console.log(`🚀 Comment Service (with Socket.IO) is running on port ${PORT}`);
});
