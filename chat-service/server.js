const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();


const messageRoutes = require('./routes/messageRoute');
const conversationRoutes = require('./routes/conversationRoute');
const redisClient = require('./config/redisClient');
const Message = require('./models/message');
const { sendMessage } = require('./controllers/messageController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});

app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error(err));

app.use('/messages', messageRoutes);
app.use('/conversations', conversationRoutes);

// Socket.io xử lý real-time
io.on('connection', (socket) => {
  console.log('🔥 User connected:', socket.id);

  // Khi người dùng online
  socket.on('userOnline', async (userId) => {
    await redisClient.set(`online:${userId}`, '1', { EX: 300 }); // Online trong 5 phút
    console.log(`✅ User ${userId} is online`);
  });

  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`📌 User joined room: ${conversationId}`);
  });

  socket.on('sendMessage', async ({ conversationId, senderId, type, content, name, senderAvatar, timestamp, isDeleted, isPinned, fileName, fileType }) => {
    console.log('Received message from client:', content);

    // const newMessage = new Message({ conversationId, senderId, type, content, timestamp, isDeleted, isPinned });

    try {
      // Gọi hàm sendMessage từ controller để xử lý và lưu tin nhắn
      // const newMessage = await sendMessage({ conversationId, senderId, type, content, timestamp, isDeleted, isPinned });
      const newMessage = await sendMessage({
        conversationId, 
        senderId, 
        type, 
        content, 
        timestamp, 
        isDeleted, 
        isPinned, 
        fileName,
        fileType,
      });

      // Gửi tin nhắn tới các client trong phòng chat tương ứng
      // io.to(conversationId).emit('newMessage', newMessage);
      io.to(conversationId).emit('receiveMessage', {
        ...newMessage.toObject(),
        name,
        senderAvatar,
      });
      console.log('✅ Sent new message to room:', conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('revokeMessage', async (data) => {
    const { messageId, senderId, conversationId } = data;
  
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }
  
      if (message.senderId.toString() !== senderId.toString()) {
        return socket.emit('error', { message: "You don't have permission to revoke this message" });
      }
  
      message.isDeleted = true;
      message.content = "Message revoked";
      message.type = 'text'; 
      await message.save();
  
      // Phát sự kiện cho tất cả các client trong phòng chat
      io.to(conversationId).emit('messageRevoked', { messageId, senderId });
  
      console.log('✅ Message revoked and event emitted to room:', conversationId);
    } catch (error) {
      console.error('Error revoking message:', error);
    }
  });

  socket.on('deleteMessage', async (data) => {
    const { messageId, senderId, conversationId } = data;
  
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }
  
      if (message.senderId.toString() !== senderId.toString()) {
        return socket.emit('error', { message: "You don't have permission to delete this message" });
      }
  
      await message.deleteOne();
  
      // Phát sự kiện cho tất cả các client trong phòng chat
      io.to(conversationId).emit('messageDeleted', { messageId, senderId });
  
      console.log('✅ Message deleted and event emitted to room:', conversationId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  });

   // Khi người dùng rời phòng (disconnect)
  socket.on('disconnect', async () => {
    console.log('❌ User disconnected:', socket.id);
    // await redisClient.del(`online:${socket.id}`);
  });
});

const PORT = process.env.PORT || 5005;
server.listen(PORT, () => console.log(`🚀 Chat Service running on port ${PORT}`));
 