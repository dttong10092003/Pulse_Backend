const Message = require('../models/message');
const redisClient = require('../config/redisClient');

// 📌 Gửi tin nhắn và cập nhật Redis
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    const newMessage = new Message({ conversationId, senderId, text });
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
