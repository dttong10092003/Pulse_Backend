// auth-service/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoute = require('./routes/authRoute');
const { autoBanAndUnbanUsers } = require('./controllers/authController');
dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("✅ Connected to MongoDB");

  // Gọi khi server khởi động
  try {
    autoBanAndUnbanUsers().catch(err => {
      console.error("⚠️ Initial autoBan failed:", err.message);
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }

  // Lặp lại mỗi giờ mà không làm crash app nếu lỗi
  setInterval(() => {
    try {
      autoBanAndUnbanUsers().catch(err => {
        console.error("⚠️ Recurring autoBan failed:", err.message);
      });
    } catch (err) {
      console.error("❌ Recurring autoBan critical error:", err.message);
    }
  }, 60 * 60 * 1000);

}).catch((err) => {
  console.error("🚫 MongoDB connection error:", err);
});


app.use('/auth', authRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
