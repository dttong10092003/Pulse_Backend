const Like = require('../models/like');
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

const likePost = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const postId = req.params.postId;

        const existingLike = await Like.findOne({ userId, postId });
        if (existingLike) {
            return res.status(400).json({ message: 'You have already liked this post' });
        }

        const newLike = new Like({ postId, userId, timestamp: new Date() });
        await newLike.save();

        res.status(201).json({ message: 'Post liked successfully', newLike });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

const unlikePost = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const postId = req.params.postId;

        const like = await Like.findOne({ userId, postId });
        if (!like) {
            return res.status(404).json({ message: 'Like not found' });
        }

        await like.deleteOne();
        res.json({ message: 'Post unliked successfully' });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

const getLikeCount = async (req, res) => {
    try {
        const postId = req.params.postId;
        const likeCount = await Like.countDocuments({ postId });
        res.json({ postId, likeCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getUsersWhoLiked = async (req, res) => {
    try {
        const postId = req.params.postId;
        const likes = await Like.find({ postId }).select('userId timestamp');
        res.json(likes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const getUserLikedPosts = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const likes = await Like.find({ userId }).select('postId');
        const likedPostIds = likes.map((like) => like.postId.toString());
        res.json({ likedPostIds });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { likePost, unlikePost, getLikeCount, getUsersWhoLiked, getUserLikedPosts };