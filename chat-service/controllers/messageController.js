const Message = require('../models/message');
const redisClient = require('../config/redisClient');
const { uploadToCloudinary } = require('../utils/cloudinary');

// 📌 Lấy 5 tin nhắn gần nhất là hình ảnh
exports.getRecentImages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const images = await Message.find({
      conversationId: conversationId,
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
      conversationId: conversationId,
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

    // Kiểm tra xem tin nhắn có tồn tại trong cơ sở dữ liệu không
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    // Kiểm tra tin nhắn có phải là đã ghim hay chưa
    if (message.isPinned) {
      return res.status(400).json({ message: "Tin nhắn đã được ghim rồi" });
    }

  // Kiểm tra số lượng tin nhắn đã ghim
    const pinnedMessages = await redisClient.lRange(`pinned:${conversationId}`, 0, -1);
    if (pinnedMessages.length >= 2) {
      return res.status(400).json({ message: "Chỉ có thể ghim tối đa 2 tin nhắn" });
    }

    // Ghim tin nhắn vào Redis và cập nhật cơ sở dữ liệu
    await redisClient.rPush(`pinned:${conversationId}`, messageId);
    message.isPinned = true;
    await message.save();

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
    const pinnedMessages = await Message.find({ _id: { $in: pinnedMessagesIds }, isDeleted: false, isPinned: true });
    if (!pinnedMessages || pinnedMessages.length === 0) {
      return res.status(404).json({ message: "Không có tin nhắn nào được ghim" });
    }

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

    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    // Nếu tin nhắn là loại file, chuyển type thành text và thay đổi nội dung
    if (message.type !== 'text') {
      message.type = 'text';
    }

    message.isDeleted = true;
    message.content = "Message revoked";
    message.isPinned = false; // Bỏ ghim nếu tin nhắn đã được ghim
    
    await message.save();
    await redisClient.lRem(`pinned:${message.conversationId}`, 1, messageId); // Xóa khỏi danh sách ghim trong Redis nếu có
    

    res.json({ messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId, senderId } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Tin nhắn không tồn tại" });
    }

    // Kiểm tra quyền người gửi
    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền xóa tin nhắn này" });
    }

    // Xóa tin nhắn khỏi cơ sở dữ liệu
    await message.deleteOne();

    // Cập nhật Redis (xóa cache)
    await redisClient.del(`messages:${message.conversationId}`);

    res.json({ messageId });
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

     // Cập nhật trong cơ sở dữ liệu
     const message = await Message.findById(messageId);
     if (!message) {
       return res.status(404).json({ message: "Tin nhắn không tồn tại" });
     }
     
     message.isPinned = false;
     await message.save();

    res.status(200).json({ message: "Tin nhắn đã được bỏ ghim" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const parseBase64 = (base64String) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }

  const mimeType = matches[1]; // ví dụ: image/png
  const base64Data = matches[2]; // phần sau dấu phẩy

  const buffer = Buffer.from(base64Data, 'base64');
  return { mimeType, buffer };
};


// 📌 Gửi tin nhắn và cập nhật Redis
exports.sendMessage = async ({ conversationId, senderId, type, content, timestamp, isDeleted, isPinned, fileName, fileType }) => {
  try {
    let fileUrl = content;

    if (['image', 'video', 'audio', 'file'].includes(type)) {
      const isBase64 = typeof content === 'string' && content.startsWith('data:');
      const isUrl = typeof content === 'string' && content.startsWith('http');

      if (isBase64 && fileName && fileType) {
        const { buffer } = parseBase64(content);
        const cloudinaryResponse = await uploadToCloudinary(buffer, fileName, "chat_files");
        fileUrl = cloudinaryResponse;
      } else if (!isUrl) {
        throw new Error("Invalid file upload: must be base64 or uploaded URL");
      }
    }

    const newMessage = new Message({ conversationId, senderId, type, content: fileUrl, timestamp, isDeleted, isPinned });
    await newMessage.save();

    // try{
    //   // Cập nhật Redis: Xóa cache tin nhắn cũ để tải lại tin mới nhất
    // await redisClient.del(`messages:${conversationId}`);

    // // Cập nhật danh sách cuộc trò chuyện gần đây của user
    // await redisClient.zAdd(`recentChats:${senderId}`, { score: Date.now(), value: conversationId });
    // } catch (redisError) {
    //   console.warn('⚠️ Redis error:', redisError.message);
    // }
    

    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    // res.status(500).json({ error: error.message });
    throw new Error(error.message);
  }
};



// // 📌 Gửi tin nhắn và cập nhật Redis
// exports.sendMessage = async (req, res) => {
//   try {
//     const { conversationId, senderId, type, content, timestamp, isDeleted, isPinned } = req.body;
//     let fileUrl = content;

//     if(type === 'image' || type === 'file' || type === 'video' || type === 'audio'){
//       const file = req.files?.file;
//       if(file){
//         const cloudinaryResponse = await uploadToCloudinary(file.data, "chat_files");
//         fileUrl = cloudinaryResponse;
//       } else {
//         return res.status(400).json({ message: "No file uploaded" });
//       }
//     }

//     const newMessage = new Message({ conversationId, senderId, type, content: fileUrl, timestamp, isDeleted, isPinned });
//     await newMessage.save();

//     // Cập nhật Redis: Xóa cache tin nhắn cũ để tải lại tin mới nhất
//     await redisClient.del(`messages:${conversationId}`);

//     // Cập nhật danh sách cuộc trò chuyện gần đây của user
//     await redisClient.zAdd(`recentChats:${senderId}`, { score: Date.now(), value: conversationId });

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error('Error sending message:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

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



// [GET] /chat/messages/unread/:userId
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const keys = await redisClient.keys(`unread:${userId}:*`);
    const unread = {};

    for (const key of keys) {
      const parts = key.split(':');
      const conversationId = parts[2];
      const count = await redisClient.get(key);
      unread[conversationId] = parseInt(count, 10);
    }

    res.status(200).json(unread); 
  } catch (error) {
    console.error('❌ Lỗi lấy số tin chưa đọc:', error);
    res.status(500).json({ error: error.message });
  }
};

// get all message meta
