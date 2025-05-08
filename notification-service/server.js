require('dotenv').config(); // 👈 load biến từ .env đầu tiên

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');



const notificationRoutes = require('./routes/notificationRoutes');
const notificationSocket = require('./sockets/notificationSocket');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const userSocketMap = {}; // Map userId ↔ socketId

app.use(cors());
app.use(express.json());


app.use('/noti', notificationRoutes(io, userSocketMap));

// Setup socket
notificationSocket(io, userSocketMap);

// 🔥 Connect DB từ biến env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Start server
const PORT = process.env.PORT || 5007;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
