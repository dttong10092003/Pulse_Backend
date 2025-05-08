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

// like 1 bài post
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

// unlike 1 bài post
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




// lấy danh sách người đã like 1 bài post
const getUsersWhoLiked = async (req, res) => {
    try {
        const postId = req.params.postId;
        const likes = await Like.find({ postId }).select('userId timestamp');
        res.json(likes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// lấy danh sách bài post mà user đã like
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


// Đếm số lượng like cho nhiều postId cùng lúc
const getLikeCountsByPosts = async (req, res) => {
    try {
        const { postIds } = req.body;

        if (!Array.isArray(postIds)) {
            return res.status(400).json({ message: 'postIds must be an array' });
        }

        // Query count for each postId
        const counts = await Promise.all(
            postIds.map(async (postId) => {
                const count = await Like.countDocuments({ postId });
                return { postId, count };
            })
        );

        // Chuyển kết quả thành object dạng { postId: count, ... }
        const result = {};
        counts.forEach(({ postId, count }) => {
            result[postId] = count;
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { likePost, unlikePost, getUsersWhoLiked, getUserLikedPosts, getLikeCountsByPosts };