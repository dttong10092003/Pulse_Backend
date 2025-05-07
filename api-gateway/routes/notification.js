const express = require('express');
const notificationService = require('../services/notificationService');

const router = express.Router();

// 🔔 Notification routes

router.get('/get-all', notificationService.getAllNotifications);
router.patch('/read-one/:id',  notificationService.markOneAsRead);
router.patch('/read-all', notificationService.markManyAsRead);
router.post('/create',  notificationService.createNotification);

module.exports = router;
