const Post = require('../models/post');
const jwt = require('jsonwebtoken');
// Hàm xác thực JWT và lấy userId
const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    console.log("🔹 Headers received in post-service:", req.headers); // Debug headers
    
    if (!authHeader) {
        throw { status: 401, message: 'Unauthorized: No token provided' };
    }
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    console.log("🔹 Extracted token in post-service:", token); // Debug token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded); // Debug token sau khi giải mã
        return decoded.userId; // Trả về userId từ token
    } catch (error) {
        console.error("❌ Token verification failed:", error.message); // Debug lỗi JWT
        throw { status: 403, message: 'Forbidden: Invalid token' };
    }
};

// Tạo bài viết (Yêu cầu đăng nhập)
const createPost = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const { content, media, tags } = req.body;

        const newPost = new Post({ userId, content, media, tags });
        await newPost.save();

        res.status(201).json(newPost);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// Xóa bài viết (Yêu cầu đăng nhập & chỉ chủ sở hữu mới xóa được)
const deletePost = async (req, res) => {
    try {
        const userId = verifyToken(req);

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Kiểm tra quyền sở hữu bài viết
        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own posts' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// Lấy tất cả bài viết (Không yêu cầu đăng nhập)
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find(); 
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Lấy bài viết theo ID (Không yêu cầu đăng nhập)
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createPost, getAllPosts, getPostById, deletePost };
