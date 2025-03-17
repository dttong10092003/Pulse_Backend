const mongoose = require('mongoose');
const Conversation = require('../models/conversation');
const redisClient = require('../config/redisClient');

// 📌 Kiểm tra trạng thái online của user
exports.checkUserOnline = async (req, res) => {
  try {
    const { userId } = req.params;
    const isOnline = await redisClient.get(`online:${userId}`);
    
    res.json({ userId, online: isOnline === '1' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOrGetPrivateConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.body;
    const conversationId = [user1, user2].sort().join('_');

    let conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      conversation = new Conversation({ conversationId, members: [user1, user2], isGroup: false });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Tạo nhóm chat
exports.createGroupConversation = async (req, res) => {
  try {
    const { groupName, members } = req.body;

    const newGroup = new Conversation({
      conversationId: new mongoose.Types.ObjectId(),
      groupName,
      members,
      isGroup: true,
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Thêm thành viên vào nhóm
exports.addMemberToGroup = async (req, res) => {
  try {
    const { conversationId, newMember } = req.body;
    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (!conversation.members.includes(newMember)) {
      conversation.members.push(newMember);
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Lấy danh sách chat gần đây của user
exports.getRecentConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy danh sách chat từ Redis (tối đa 10 cuộc trò chuyện gần nhất)
    const recentConversations = await redisClient.zRange(`recentChats:${userId}`, 0, 9, { REV: true });

    // Nếu có dữ liệu từ Redis, trả về ngay lập tức
    if (recentConversations.length > 0) {
      return res.json(recentConversations);
    }

    // Nếu không có trong Redis, lấy từ MongoDB
    const conversations = await Conversation.find({ members: userId }).sort({ updatedAt: -1 }).limit(10);
    
    // Cập nhật Redis
    for (const conv of conversations) {
      await redisClient.zAdd(`recentChats:${userId}`, { score: Date.now(), value: conv.conversationId });
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
