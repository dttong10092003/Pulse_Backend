const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const {
    getRecentNotifications,
    getAllNotifications,
    markOneAsRead,
    markManyAsRead,
    createNotification
} = require('../controllers/notificationController');

// Áp dụng verifyToken cho tất cả route
router.use(verifyToken);

// Danh sách route
router.get('/noti/ListRecent', getRecentNotifications);       // 10 thông báo gần nhất
router.get('/noti/ListNotification', getAllNotifications);    // tất cả thông báo
router.patch('/noti/MarkOne/:id', markOneAsRead);             // đánh dấu 1 cái
router.patch('/noti/MarkMany', markManyAsRead);               // đánh dấu nhiều cái
router.post('/noti/Create', createNotification);              // tạo thông báo mới

module.exports = router;
