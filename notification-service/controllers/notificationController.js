const Notification = require('../models/notificationModel');

// ✅ Lấy 10 thông báo gần nhất
const getRecentNotifications = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: 'Missing userId' });

        const notifications = await Notification.find({ receiverId: userId })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Lấy tất cả thông báo
const getAllNotifications = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: 'Missing userId' });

        const notifications = await Notification.find({ receiverId: userId })
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Đánh dấu 1 thông báo đã đọc
const markOneAsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'Missing userId' });

        const notification = await Notification.findById(req.params.id);
        if (!notification || notification.receiverId !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Marked as read', notification });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Đánh dấu nhiều thông báo đã đọc
const markManyAsRead = async (req, res) => {
    try {
        const { ids, userId } = req.body;
        if (!userId || !ids) return res.status(400).json({ message: 'Missing userId or ids' });

        await Notification.updateMany(
            { _id: { $in: ids }, receiverId: userId },
            { $set: { isRead: true } }
        );

        res.json({ message: 'Marked multiple as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ✅ Tạo thông báo mới
const createNotification = async (req, res) => {
    try {
      const {
        type, receiverId, senderId,
        messageContent, chatId,
        postId, commentContent
      } = req.body;
  
      if (!type || !receiverId || !senderId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      if (!['message', 'like', 'comment', 'follow'].includes(type)) {
        return res.status(400).json({ message: 'Invalid notification type' });
      }
  
      const notification = new Notification({
        type,
        receiverId,
        senderId,
        messageContent,
        chatId,
        postId,
        commentContent
      });
  
      await notification.save();
  
      // 👉 Gửi realtime qua socket
      const io = req.app.get("io");
      io.to(receiverId).emit("new_notification", notification); // gửi nguyên bản ghi
  
      res.status(201).json({ message: 'Notification created', notification });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  

module.exports = {
    getRecentNotifications,
    getAllNotifications,
    markOneAsRead,
    markManyAsRead,
    createNotification
};
