// File: controllers/commentController.js
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const mongoose = require('mongoose');

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
    res.status(201).json({ message: 'Comment added successfully', comment: newComment });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// GET /comments/:postId
const getCommentsByPost = async (req, res) => {
    try {
      const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
  
      if (comments.length === 0) {
        return res.json([]); // Không cần gọi user-service
      }
  
      const userIds = [...new Set(comments.map(c => c.userId?.toString()).filter(Boolean))];
  
      if (userIds.length === 0) {
        return res.json(comments); // Có comment nhưng không có userId
      }
  
      const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
        userIds
      });
  
      const userList = userRes.data;
      const userMap = {};
      userList.forEach(user => {
        userMap[user.userId.toString()] = user;
      });
  
      const commentsWithUserInfo = comments.map(comment => {
        const user = userMap[comment.userId?.toString()];
        return {
          ...comment.toObject(),
          user: {
            firstname: user?.firstname || "Ẩn",
            lastname: user?.lastname || "Danh",
            avatar: user?.avatar || "https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg"
          }
        };
      });
  
      res.json(commentsWithUserInfo);
    } catch (err) {
      console.error("❌ getCommentsByPost failed:", err.message);
      res.status(500).json({ message: err.message });
    }
  };
  
  

// POST /comments/reply/:commentId
const addReplyToComment = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { text } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    comment.replies.push({ userId, text, timestamp: new Date() });
    comment.updatedAt = new Date();
    await comment.save();
    res.status(201).json({ message: 'Reply added successfully', comment });
  } catch (err) {
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