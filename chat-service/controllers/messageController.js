const Message = require('../models/message');
const redisClient = require('../config/redisClient');

// 📌 Lấy 5 tin nhắn gần nhất là hình ảnh
exports.getRecentImages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const images = await Message.find({
      conversationId,
      type: 'image'
    }).sort({ timestamp: -1 }).limit(5);

    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Lấy 5 tin nhắn gần nhất là file
exports.getRecentFiles = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const files = await Message.find({
      conversationId,
      type: 'file'
    }).sort({ timestamp: -1 }).limit(5);

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Ghim tối đa 2 tin nhắn
exports.pinMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.body;

    const pinnedMessages = await redisClient.lRange(`pinned:${conversationId}`, 0, -1);
    if (pinnedMessages.length >= 2) {
      return res.status(400).json({ message: "Chỉ có thể ghim tối đa 2 tin nhắn" });
    }

    await redisClient.rPush(`pinned:${conversationId}`, messageId);
    res.status(200).json({ message: "Tin nhắn đã được ghim" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Lấy tin nhắn đã ghim
exports.getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const pinnedMessagesIds = await redisClient.lRange(`pinned:${conversationId}`, 0, -1);
    const pinnedMessages = await Message.find({ _id: { $in: pinnedMessagesIds } });

    res.json(pinnedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Thu hồi tin nhắn
exports.revokeMessage = async (req, res) => {
  try {
    const { messageId, senderId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    if (message.senderId !== senderId) {
      return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    message.isDeleted = true;
    message.content = "Message revoked";
    await message.save();

    res.json({ message: "Tin nhắn đã được thu hồi" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Bỏ ghim tin nhắn
exports.unpinMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.body;

    // Kiểm tra tin nhắn có đang được ghim không
    const pinnedMessages = await redisClient.lRange(`pinned:${conversationId}`, 0, -1);
    
    if (!pinnedMessages.includes(messageId)) {
      return res.status(400).json({ message: "Tin nhắn không nằm trong danh sách ghim" });
    }

    // Xóa tin nhắn khỏi danh sách ghim
    await redisClient.lRem(`pinned:${conversationId}`, 1, messageId);

    res.status(200).json({ message: "Tin nhắn đã được bỏ ghim" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Gửi tin nhắn và cập nhật Redis
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, type, content } = req.body;

    const newMessage = new Message({ conversationId, senderId, type, content });
    await newMessage.save();

    // Cập nhật Redis: Xóa cache tin nhắn cũ để tải lại tin mới nhất
    await redisClient.del(`messages:${conversationId}`);

    // Cập nhật danh sách cuộc trò chuyện gần đây của user
    await redisClient.zAdd(`recentChats:${senderId}`, { score: Date.now(), value: conversationId });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Lấy tin nhắn (tận dụng Redis cache)
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Kiểm tra cache trong Redis trước
    const cachedMessages = await redisClient.get(`messages:${conversationId}`);
    if (cachedMessages) {
      return res.json(JSON.parse(cachedMessages));
    }

    // Nếu không có trong cache, lấy từ MongoDB
    const messages = await Message.find({ conversationId });

    // Cache tin nhắn trong Redis (60 giây)
    await redisClient.set(`messages:${conversationId}`, JSON.stringify(messages), { EX: 60 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
