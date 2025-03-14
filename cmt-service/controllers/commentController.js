const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');

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

const createComment = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const { postId, text } = req.body;
        const newComment = new Comment({ postId, userId, text });
        await newComment.save();
        res.status(201).json({ message: 'Comment added successfully', newComment });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

const getCommentsByPost = async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId });
        res.json(comments);
    } catch (err) {
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
        comment.replies.push({ userId, text, timestamp: new Date() });
        comment.updatedAt = new Date();
        await comment.save();
        res.status(201).json({ message: 'Reply added successfully', comment });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

module.exports = { createComment, getCommentsByPost, addReplyToComment };