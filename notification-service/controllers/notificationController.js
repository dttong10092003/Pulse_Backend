const Notification = require('../models/notificationModel');
exports.sendNotification = (io, userSocketMap) => async (req, res) => {
  try {
    const { type, receiverIds, senderId, messageContent, postId, commentContent } = req.body;
    const notifications = [];

    for (const receiverId of receiverIds) {
      let notificationData = {
        type,
        receiverId,
        senderId,
      };

      // Gán thêm thông tin tùy loại
      if (type === 'message') {
        notificationData.messageContent = messageContent;
      } else if (type === 'like' || type === 'comment') {
        notificationData.postId = postId;
        if (type === 'comment') {
          notificationData.commentContent = commentContent;
        }
      }

      // 🔁 Kiểm tra xem đã tồn tại thông báo cho like/follow chưa
      let existingNotification = null;
      if (type === 'like') {
        existingNotification = await Notification.findOne({ type, senderId, receiverId, postId });
      } else if (type === 'follow') {
        existingNotification = await Notification.findOne({ type, senderId, receiverId });
      }

      let notification = null;

      if (existingNotification) {
        // 🔄 Nếu đã có: cập nhật trạng thái và thời gian
        existingNotification.isRead = false;
        existingNotification.updatedAt = new Date();
        await existingNotification.save();
        notification = existingNotification;

        console.log("🔁 Notification tồn tại, đã cập nhật:", notification);
      } else {
        // ✨ Nếu chưa có: tạo mới như thường
        notification = await Notification.create(notificationData);
        console.log("📨 Notification mới:", notification);
      }

      // 🔔 Gửi socket nếu user đang online
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_notification", notification);
        console.log(`📡 Gửi socket đến user ${receiverId}`);
      } else {
        console.log(`🔕 User ${receiverId} offline`);
      }

      notifications.push(notification);
    }

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("🔥 Lỗi gửi notification:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



/// Lấy tất cả thông báo của người dùng
  exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: 'Missing userId' });

        const notifications = await Notification.find({ receiverId: userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Đánh dấu 1 thông báo đã đọc
exports.markOneAsRead = async (req, res) => {
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

// Đánh dấu nhiều thông báo đã đọc
exports.markManyAsRead = async (req, res) => {
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
