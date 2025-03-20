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
    const { user1, user2, user1Name, user2Name } = req.body;
    const conversationId = [user1, user2].sort().join('_');

    let conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      // ✅ Đặt groupName = Tên người còn lại
      const groupName = user1 === conversationId.split('_')[0] ? user2Name : user1Name;
      conversation = new Conversation({ conversationId, members: [user1, user2], isGroup: false, groupName });
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
    const { groupName, members, adminId } = req.body;

    const newGroup = new Conversation({
      conversationId: new mongoose.Types.ObjectId(),
      groupName,
      members,
      isGroup: true,
      adminId
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

// 📌 Xóa thành viên khỏi nhóm (Chỉ admin có quyền)
exports.removeMemberFromGroup = async (req, res) => {
  try {
    const { conversationId, adminId, memberId } = req.body;
    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (conversation.adminId !== adminId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa thành viên" });
    }

    conversation.members = conversation.members.filter(member => member !== memberId);
    await conversation.save();

    res.status(200).json({ message: "Xóa thành viên thành công", conversation });
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

exports.changeGroupAdmin = async (req, res) => {
  try {
    const { conversationId, adminId, newAdminId } = req.body;
    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (conversation.adminId !== adminId) {
      return res.status(403).json({ message: "Bạn không có quyền chuyển trưởng nhóm" });
    }

    if (!conversation.members.includes(newAdminId)) {
      return res.status(400).json({ message: "Thành viên mới không có trong nhóm" });
    }

    conversation.adminId = newAdminId;
    await conversation.save();

    res.status(200).json({ message: "Chuyển quyền trưởng nhóm thành công", conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Tìm kiếm cuộc trò chuyện theo tên nhóm hoặc tên người còn lại
exports.searchConversations = async (req, res) => {
  try {
    const { userId, keyword } = req.query;

    // ✅ Tìm nhóm chat theo tên nhóm (groupName)
    const groupChats = await Conversation.find({
      groupName: { $regex: keyword, $options: 'i' },
      isGroup: true
    });

    // ✅ Tìm chat riêng theo tên hiển thị của người còn lại
    const privateChats = await Conversation.find({
      members: userId,
      isGroup: false
    });

    let formattedPrivateChats = [];

    for (const conv of privateChats) {
      const otherUserId = conv.members.find(member => member !== userId);

      // 💡 Tìm theo tên hiển thị (groupName) của người còn lại
      if (conv.groupName.toLowerCase().includes(keyword.toLowerCase())) {
        formattedPrivateChats.push(conv);
      }
    }

    // ✅ Trả về danh sách chat phù hợp với keyword
    res.json([...groupChats, ...formattedPrivateChats]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
