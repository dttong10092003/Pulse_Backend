const express = require('express');
const notificationService = require('../services/notificationService');

const router = express.Router();

// 🔔 Notification routes
router.get('/recent', notificationService.getRecentNotifications);
router.get('/all', notificationService.getAllNotifications);
router.patch('/markOne/:id',  notificationService.markOneAsRead);
router.patch('/markMany', notificationService.markManyAsRead);
router.post('/create',  notificationService.createNotification);

module.exports = router;
