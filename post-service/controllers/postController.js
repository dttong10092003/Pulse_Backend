const Post = require('../models/post');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary, deleteFromCloudinaryByUrl } = require('../utils/cloudinary');
const axios = require('axios');
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
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

        let uploadedMedia = [];

        if (media && Array.isArray(media) && media.length > 0) {
            // Duyệt và upload từng ảnh/video
            uploadedMedia = await Promise.all(
                media.map((fileBase64) => uploadToCloudinary(fileBase64, 'posts'))
            );
        }

        const newPost = new Post({
            userId,
            content,
            media: uploadedMedia,
            tags
        });

        await newPost.save();

        res.status(201).json(newPost);
    } catch (err) {
        console.error("❌ createPost error:", err);
        res.status(err.status || 500).json({ message: err.message });
    }
};

// Xóa bài viết (Yêu cầu đăng nhập & chỉ chủ sở hữu mới xóa được)
const deletePost = async (req, res) => {
    try {
        const userId = verifyToken(req);

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only delete your own posts' });
        }

        // ✅ Gọi xoá từng media kèm log
        if (Array.isArray(post.media) && post.media.length > 0) {
            await Promise.all(
                post.media.map(async (fileUrl) => {
                    console.log("🧹 Đang xoá media:", fileUrl);
                    await deleteFromCloudinaryByUrl(fileUrl);
                })
            );
        }

        await post.deleteOne();

        res.json({ message: 'Post and associated media deleted successfully' });
    } catch (err) {
        console.error("❌ Error deleting post:", err);
        res.status(err.status || 500).json({ message: err.message });
    }
};

// Lấy tất cả bài viết (Không yêu cầu đăng nhập)
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        const userIds = [...new Set(posts.map(p => p.userId.toString()))];

        // Gọi sang user-service để lấy thông tin user theo danh sách userIds
        const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
            userIds
        });

        const userList = userRes.data; // Mảng [{ userId, firstname, lastname, avatar }]
        const userMap = {};
        userList.forEach(user => {
            userMap[user.userId.toString()] = user;
        });

        // Gộp dữ liệu user vào post
        const postsWithUserInfo = posts.map(post => {
            const user = userMap[post.userId.toString()];
            return {
                ...post.toObject(),
                username: `${user?.firstname || "Ẩn"} ${user?.lastname || "Danh"}`,
                avatar: user?.avatar || "https://picsum.photos/200"
            };
        });

        res.json(postsWithUserInfo);
    } catch (err) {
        console.error("❌ getAllPosts failed:", err.message);
        console.error("📌 Full error:", err.response?.data || err);
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
// Lấy bài viết theo userId (Yêu cầu đăng nhập)
const getPostsByUser = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: "Missing userId" });
        }

        const posts = await Post.find({ userId }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Sửa bài viết (Yêu cầu đăng nhập & chỉ chủ sở hữu mới chỉnh sửa được)
const editPost = async (req, res) => {
    try {
      const userId = verifyToken(req);
      const { content, media } = req.body;
  
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
  
      if (post.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only edit your own posts' });
      }
  
      if (Array.isArray(media)) {
        // Xác định media nào là đã có sẵn (URL Cloudinary) và media nào là base64 mới upload
        const newMedia = [];
        const existingMedia = [];
  
        for (const item of media) {
          if (item.startsWith('data:')) {
            newMedia.push(item); // base64 cần upload
          } else {
            existingMedia.push(item); // URL đã upload rồi
          }
        }
  
        // Nếu có file base64 thì upload
        let uploadedMedia = [];
        if (newMedia.length > 0) {
          uploadedMedia = await Promise.all(
            newMedia.map((fileBase64) => uploadToCloudinary(fileBase64, 'posts'))
          );
        }
  
        // Media cuối cùng = file đã có + file mới upload
        post.media = [...existingMedia, ...uploadedMedia];
      }
  
      if (content) post.content = content;
  
      await post.save();
  
      res.json({ message: 'Post updated successfully', post });
    } catch (err) {
      console.error("❌ editPost error:", err);
      res.status(err.status || 500).json({ message: err.message });
    }
  };
  

module.exports = { createPost, getAllPosts, getPostById, deletePost, getPostsByUser, editPost };
