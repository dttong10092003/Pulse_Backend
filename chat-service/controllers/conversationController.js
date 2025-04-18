const mongoose = require('mongoose');
const Conversation = require('../models/conversation');
const redisClient = require('../config/redisClient');
const axios = require('axios');
const Message = require('../models/message');

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

// 📌 Lấy tất cả cuộc trò chuyện của user
exports.getAllConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Conversation.find({
      members: { $in: [userObjectId] },  // Lọc các cuộc trò chuyện mà user tham gia
    });

    /////
    if (!conversations.length) {
      return res.json([]);
    }

    // 🔹 Tạo danh sách userId cần lấy thông tin
    const userIds = [...new Set(conversations.flatMap(convo => convo.members.map(id => id.toString())))];

    // 🔹 Gọi API từ User Service để lấy thông tin user
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5002';
    const userResponse = await axios.post(`${userServiceUrl}/users/user-details-by-ids`, { userIds });

    // 🔍 Kiểm tra dữ liệu trả về từ User Service
    console.log('🟢 User Service Response:', JSON.stringify(userResponse.data, null, 2));

    if (!userResponse.data || !Array.isArray(userResponse.data)) {
      console.error('❌ Lỗi khi gọi API User Service:', userResponse.data);
      return res.status(500).json({ error: 'Không thể lấy thông tin user' });
    }

    // 🔹 Chuyển danh sách user thành object để tra cứu nhanh
    const userMap = userResponse.data.reduce((acc, user) => {
      acc[user.userId] = { 
        userId: user.userId,
        name: `${user.firstname} ${user.lastname}`.trim() || 'Unknown',
        avatar: user.avatar || '' };
      return acc;
    }, {});

    // 🔹 Gán thông tin members và lấy tin nhắn
    const updatedConversations = await Promise.all(conversations.map(async (conversation) => {
      conversation = conversation.toObject(); // Chuyển Mongoose document thành object

      // Thay thế members từ ObjectId sang object chứa thông tin user
      conversation.members = conversation.members.map(userId => userMap[userId.toString()] || { userId, name: 'Unknown', avatar: '' });

      // Lấy tin nhắn gần nhất
      const messages = await Message.find({ conversationId: conversation._id })
        .sort({ timestamp: 1 });

      conversation.messages = messages.map(msg => {
        const senderInfo = userMap[msg.senderId.toString()] || { name: 'Unknown', avatar: '' };

        return {
        _id: msg._id,
        senderId: msg.senderId,
        name: senderInfo.name,
        content: msg.content,
        type: msg.type,
        timestamp: msg.timestamp,
        isSentByUser: msg.senderId.toString() === userId,
        senderAvatar: senderInfo.avatar,
        isDeleted: msg.isDeleted || false,
        isPinned: msg.isPinned || false
        };
      });

      return conversation;
    }));

    res.json(updatedConversations);
  } catch (error) {
    console.error('❌ Lỗi trong getAllConversations:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.createOrGetPrivateConversation = async (req, res) => {
  try {
    const { user1, user2} = req.body;
    const conversationId = new mongoose.Types.ObjectId();

    let conversation = await Conversation.findOne({ 
      members: { $all: [user1, user2] },
      isGroup: false 
    });

    if (!conversation) {
      conversation = new Conversation({
        conversationId, 
        members: [user1, user2], 
        isGroup: false,
      });
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
    const { groupName, members, adminId, avatar } = req.body;

    const newGroup = new Conversation({
      conversationId: new mongoose.Types.ObjectId(),
      groupName,
      members,
      isGroup: true,
      adminId,
      avatar: avatar || '', 
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
    console.log(conversationId, newMember);
    const conversation = await Conversation.findOne({ _id: conversationId });


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
    console.log(conversationId, adminId, memberId);
    const conversation = await Conversation.findOne({ _id: conversationId });


    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (conversation.adminId.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa thành viên" });
    }

    conversation.members = conversation.members.filter(member => member.toString() !== memberId.toString());
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

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Lấy danh sách chat từ Redis (tối đa 10 cuộc trò chuyện gần nhất)
    const recentConversations = await redisClient.zRange(`recentChats:${userId}`, 0, 9, { REV: true });

    console.log(`Recent Conversations from Redis: ${recentConversations}`);
    // Nếu có dữ liệu từ Redis, trả về ngay lập tức
    if (recentConversations.length > 0) {
      return res.json(recentConversations);
    }

    // Nếu không có trong Redis, lấy từ MongoDB
    const conversations = await Conversation.find({
      members: { $in: [userObjectId] } // Sử dụng $in để so sánh với mảng các ObjectId
    }).sort({ updatedAt: -1 }).limit(10);
    
    console.log(`Conversations from MongoDB: ${JSON.stringify(conversations)}`);

    // Cập nhật Redis
    for (const conv of conversations) {
      await redisClient.zAdd(`recentChats:${userId}`, { score: Date.now(), value: conv._id.toString() });
    }

    console.log(`Recent Chats updated in Redis`);

    res.json(conversations);
  } catch (error) {
    console.error(`Error in getRecentConversations: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.changeGroupAdmin = async (req, res) => {
  try {
    const { conversationId, adminId, newAdminId } = req.body;
    const conversation = await Conversation.findOne({ _id: conversationId });

    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: "Không tìm thấy nhóm chat" });
    }

    if (!conversation.adminId || !adminId || conversation.adminId.toString() !== adminId.toString()) {
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
      const otherUserId = conv.members.find(member => member.toString() !== userId.toString());

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

// 📌 Cập nhật thông tin nhóm (đổi tên, avatar, ...)
exports.updateGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params; // Lấy ID cuộc trò chuyện cần cập nhật
    const { groupName, avatar } = req.body; // Các thông tin cần cập nhật

    // Tìm cuộc trò chuyện theo ID và kiểm tra xem nó có phải nhóm không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Không thể thay đổi thông tin cuộc trò chuyện riêng tư" });
    }

    // Cập nhật thông tin nhóm (groupName và avatar)
    if (groupName) conversation.groupName = groupName;
    if (avatar !== undefined) conversation.avatar = avatar; // Kiểm tra xem có avatar mới không

    // Lưu lại những thay đổi
    await conversation.save();

    res.status(200).json({ message: "Thông tin nhóm đã được cập nhật", conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};