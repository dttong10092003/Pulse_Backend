// File: controllers/commentController.js
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

// Middleware verify token (gọn, dùng riêng trong service)
const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw { status: 401, message: 'Unauthorized: No token provided' };
  }
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    throw { status: 403, message: 'Forbidden: Invalid token' };
  }
};

// POST /comments
const createComment = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { postId, text } = req.body;
    const newComment = new Comment({ postId, userId, text });
    await newComment.save();

    // 🔥 Lấy socket từ app
    const io = req.app.get("io");
    if (io) {
      io.emit("newComment", { postId }); // cập nhật số lượng bên MainContent
      io.emit(`receive-comment-${postId}`, { postId }); // cập nhật realtime trong modal
    }

    // 🔥 Lấy thông tin user
    const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
      userIds: [userId],
    });

    const user = userRes.data[0];
    const commentWithUser = {
      ...newComment.toObject(),
      user: {
        firstname: user?.firstname || "Ẩn",
        lastname: user?.lastname || "Danh",
        avatar: user?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg",
        username: user?.username || "unknown"
      }
    };

    res.status(201).json({ message: 'Comment added successfully', comment: commentWithUser });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });

    if (comments.length === 0) return res.json([]);

    const commentUserIds = comments.map(c => c.userId?.toString()).filter(Boolean);
    const replyUserIds = comments.flatMap(c =>
      c.replies?.map(r => r.userId?.toString()).filter(Boolean) || []
    );

    const allUserIds = [...new Set([...commentUserIds, ...replyUserIds])];

    if (allUserIds.length === 0) return res.json(comments);

    const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
      userIds: allUserIds,
    });

    const userList = userRes.data;
    const userMap = {};
    userList.forEach(user => {
      userMap[user.userId.toString()] = user;
    });

    const commentsWithUserInfo = comments.map(comment => {
      const user = userMap[comment.userId?.toString()];
      const commentWithUser = {
        ...comment.toObject(),
        user: {
          firstname: user?.firstname || "Ẩn",
          lastname: user?.lastname || "Danh",
          avatar: user?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg",
        },
        replies: comment.replies?.map(reply => {
          const replyUser = userMap[reply.userId?.toString()];
          const replyObj = reply.toObject?.() || reply; 
          return {
            ...replyObj,
            user: {
              firstname: replyUser?.firstname || "Ẩn",
              lastname: replyUser?.lastname || "Danh",
              avatar: replyUser?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg",
            },
          };
        }) || [],        
      };

      return commentWithUser;
    });

    res.json(commentsWithUserInfo);
  } catch (err) {
    console.error("❌ getCommentsByPost failed:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const addReplyToComment = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { text } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = { userId, text, timestamp: new Date() };
    comment.replies.push(reply);
    comment.updatedAt = new Date();
    await comment.save();

    const lastReply = comment.replies[comment.replies.length - 1];

    // 🔥 Emit từ backend
    const io = req.app.get("io");
    const postId = comment.postId?.toString();
    if (io && postId) {
      io.emit("newComment", { postId });
      io.emit(`receive-comment-${postId}`, { postId });
    }

    const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
      userIds: [userId]
    });

    const user = userRes.data[0];
    const replyWithUser = {
      ...lastReply.toObject(),
      user: {
        firstname: user?.firstname || "Ẩn",
        lastname: user?.lastname || "Danh",
        avatar: user?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg"
      }
    };

    res.status(201).json({ message: 'Reply added successfully', reply: replyWithUser });
  } catch (err) {
    console.error("❌ addReplyToComment failed:", err.message);
    res.status(err.status || 500).json({ message: err.message });
  }
};

const getCommentCountsByPosts = async (req, res) => {
    try {
      const { postIds } = req.body;
  
      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty postIds array' });
      }
  
      const mongoose = require('mongoose'); // ⬅️ Thêm dòng này
      const counts = await Comment.aggregate([
        {
          $match: {
            postId: { $in: postIds.map(id => new mongoose.Types.ObjectId(id)) }  // ✅ dùng `new`
          }
        },
        {
          $group: {
            _id: "$postId",
            count: { $sum: 1 }
          }
        }
      ]);
  
      const result = {};
      postIds.forEach(id => {
        const found = counts.find(c => c._id.toString() === id);
        result[id] = found ? found.count : 0;
      });
  
      res.json(result);
    } catch (err) {
      console.error("❌ getCommentCountsByPosts failed:", err.message);
      res.status(500).json({ message: err.message });
    }
  };  

module.exports = {
  createComment,
  getCommentsByPost,
  addReplyToComment,
  getCommentCountsByPosts,
};