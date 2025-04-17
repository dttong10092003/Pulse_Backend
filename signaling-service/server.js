const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*', // FE URL hoặc '*'
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('join', ({ userId }) => {
    socket.join(userId); // tạo phòng cho mỗi user
    console.log(`${userId} đã tham gia phòng`);
  });

  socket.on('call-user', ({ to, offer }) => {
    socket.to(to).emit('incoming-call', { from: socket.id, offer });
  });

  socket.on('answer-call', ({ to, answer }) => {
    socket.to(to).emit('call-answered', { answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

server.listen(8000, () => {
  console.log('🚀 Signaling server listening on port 8000');
});
