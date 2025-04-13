const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
app.use(express.json({ limit: '10mb' })); // test giới hạn base64, tuần sau chuyển qua cloud

app.use(cors());

// Import routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const likeRoutes = require("./routes/likeRoutes");
const commentRoutes = require("./routes/commentRoutes");
const chatRoutes = require('./routes/chatRoutes');
const followRoutes = require('./routes/followRoutes');

// Sử dụng routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use('/chat', chatRoutes);
app.use('/follow', followRoutes);


// API kiểm tra hoạt động của Gateway
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
});
