const express = require("express");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());

// Import routes
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");

// Sử dụng routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/users", userRoutes);

// API kiểm tra hoạt động của Gateway
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
});
