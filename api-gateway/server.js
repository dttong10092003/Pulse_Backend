const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");  // Đảm bảo đã cài đặt cors

dotenv.config();
const app = express();

// Cấu hình CORS cho phép tất cả domain
app.use(cors({
  origin: '*', // Cho phép tất cả domain
  methods: ['GET', 'POST'], // Các phương thức HTTP cho phép
  allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
}));

// Cấu hình body parser middleware trước khi định nghĩa routes
app.use(express.json());

// Import các routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const likeRoutes = require("./routes/likeRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Sử dụng routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);

// API kiểm tra hoạt động của Gateway
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
});
