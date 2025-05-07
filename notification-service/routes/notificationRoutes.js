const express = require('express');
const {
  sendNotification,
  getAllNotifications,
  markOneAsRead,
  markManyAsRead
} = require('../controllers/notificationController');

module.exports = (io, userSocketMap) => {
  const router = express.Router();

  router.post('/create', sendNotification(io, userSocketMap)); // Gửi notification
  router.get('/get-all', getAllNotifications);           // ✅ Lấy all thông báo
  router.patch('/read-one/:id', markOneAsRead);           // ✅ Đánh dấu 1 đã đọc
  router.patch('/read-all', markManyAsRead);              // ✅ Đánh dấu nhiều đã đọc

  return router;
};
