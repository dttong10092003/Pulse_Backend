const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const messageRoutes = require('./routes/messageRoute');
const conversationRoutes = require('./routes/conversationRoute');
const redisClient = require('./config/redisClient');
const Message = require('./models/message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});

app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

app.use('/messages', messageRoutes);
app.use('/conversations', conversationRoutes);

// Socket.io xử lý real-time
io.on('connection', (socket) => {
  console.log('🔥 User connected:', socket.id);

  socket.on('userOnline', async (userId) => {
    await redisClient.set(`online:${userId}`, '1', { EX: 300 }); // Online trong 5 phút
    console.log(`✅ User ${userId} is online`);
  });

  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`📌 User joined room: ${conversationId}`);
  });

  socket.on('sendMessage', async ({ conversationId, senderId, type, content }) => {
    const newMessage = new Message({ conversationId, senderId, type, content });
    await newMessage.save();
    await redisClient.del(`messages:${conversationId}`);

    io.to(conversationId).emit('newMessage', newMessage);
  });

  socket.on('disconnect', async () => {
    console.log('❌ User disconnected:', socket.id);
    await redisClient.del(`online:${socket.id}`);
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`🚀 Chat Service running on port ${PORT}`));
