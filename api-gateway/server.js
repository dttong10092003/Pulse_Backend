const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.json());

app.use(cors());

{/*
  Cấu hình CORS trong backend: Trong file backend của bạn (có thể là app.js hoặc server.js), 
  bạn cần cấu hình cors để cho phép tất cả các phương thức HTTP (bao gồm PUT) từ các miền khác.
  */
}
// app.use(cors({
//   origin: 'http://localhost:5173', // Đảm bảo chỉ định chính xác origin từ frontend
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));
// Import routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const likeRoutes = require("./routes/likeRoutes");
const commentRoutes = require("./routes/commentRoutes");
const chatRoutes = require('./routes/chatRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notification');
// Sử dụng routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use('/chat', chatRoutes);
app.use('/follow', followRoutes);
app.use('/noti', notificationRoutes);

// API kiểm tra hoạt động của Gateway
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
});
