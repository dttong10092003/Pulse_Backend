const express = require('express');
const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// 🔔 Notification routes
router.get('/recent', authenticateToken, notificationService.getRecentNotifications);
router.get('/all', authenticateToken, notificationService.getAllNotifications);
router.patch('/markOne/:id', authenticateToken, notificationService.markOneAsRead);
router.patch('/markMany', authenticateToken, notificationService.markManyAsRead);
router.post('/create', authenticateToken, notificationService.createNotification);

module.exports = router;
