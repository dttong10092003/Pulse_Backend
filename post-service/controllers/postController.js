const Post = require('../models/post');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary, deleteFromCloudinaryByUrl } = require('../utils/cloudinary');
const axios = require('axios');
const mongoose = require("mongoose");
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const LIKE_SERVICE_URL = process.env.LIKE_SERVICE_URL;
const CMT_SERVICE_URL = process.env.CMT_SERVICE_URL;
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
        const { content, media, tags, sharedPostId } = req.body;
        if (!Array.isArray(tags) || tags.length === 0) {
            tags = ["Beauty"]; // Gán mặc định nếu không có
        }

        let uploadedMedia = [];
        if (media && Array.isArray(media)) {
            uploadedMedia = await Promise.all(
                media.map((file) => uploadToCloudinary(file, 'posts'))
            );
        }

        const newPost = new Post({
            userId,
            content,
            media: uploadedMedia,
            tags,
            sharedPostId: sharedPostId || null
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
// const getAllPosts = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         const posts = await Post.find()
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit);

//         const userIds = [...new Set([
//             ...posts.map(p => p.userId.toString()),
//             ...posts.filter(p => p.sharedPostId).map(p => p.sharedPostId.toString())
//         ])];

//         const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
//             userIds
//         });

//         const userMap = {};
//         userRes.data.forEach(user => {
//             userMap[user.userId] = user;
//         });

//         const postsWithUserInfo = await Promise.all(posts.map(async post => {
//             const user = userMap[post.userId.toString()];
//             let sharedPost = null;

//             if (post.sharedPostId) {
//                 try {
//                     const sp = await Post.findById(post.sharedPostId);
//                     if (sp) {
//                         const spUser = userMap[sp.userId.toString()];
//                         sharedPost = {
//                             _id: sp._id,
//                             content: sp.content,
//                             media: sp.media,
//                             username: `${spUser?.firstname || "Anomyous"} ${spUser?.lastname || ""}`,
//                             avatar: spUser?.avatar || "https://picsum.photos/200"
//                         };
//                     }
//                 } catch (err) {
//                     console.warn("⚠️ Không thể lấy sharedPost:", post.sharedPostId);
//                 }
//             }

//             return {
//                 ...post.toObject(),
//                 username: `${user?.firstname || "Anomyous"} ${user?.lastname || ""}`,
//                 avatar: user?.avatar || "https://picsum.photos/200",
//                 sharedPost
//             };
//         }));

//         res.json(postsWithUserInfo);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };
// ✅ Sửa lại hàm getAllPosts:
// ✅ Hàm getAllPosts - hỗ trợ cả phân trang và lấy toàn bộ
const getAllPosts = async (req, res) => {
    try {
        const { page, limit } = req.query;

        let postsQuery = Post.find().sort({ createdAt: -1 });

        if (page && limit) {
            const skip = (parseInt(page) - 1) * parseInt(limit);
            postsQuery = postsQuery.skip(skip).limit(parseInt(limit));
        }

        const posts = await postsQuery;

        // Lấy userId liên quan
        const userIds = [...new Set([
            ...posts.map(p => p.userId.toString()),
            ...posts.filter(p => p.sharedPostId).map(p => p.sharedPostId.toString())
        ])];

        const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
            userIds
        });

        const userMap = {};
        userRes.data.forEach(user => {
            userMap[user.userId] = user;
        });

        const postsWithUserInfo = await Promise.all(posts.map(async post => {
            const user = userMap[post.userId.toString()];
            let sharedPost = null;

            if (post.sharedPostId) {
                try {
                    const sp = await Post.findById(post.sharedPostId);
                    if (sp) {
                        const spUser = userMap[sp.userId.toString()];
                        sharedPost = {
                            _id: sp._id,
                            content: sp.content,
                            media: sp.media,
                            username: `${spUser?.firstname || "Anonymous"} ${spUser?.lastname || ""}`,
                            avatar: spUser?.avatar || "https://picsum.photos/200"
                        };
                    }
                } catch (err) {
                    console.warn("⚠️ Không thể lấy sharedPost:", post.sharedPostId);
                }
            }

            return {
                ...post.toObject(),
                username: `${user?.firstname || "Anonymous"} ${user?.lastname || ""}`,
                avatar: user?.avatar || "https://picsum.photos/200",
                sharedPost
            };
        }));

        res.json(postsWithUserInfo);
    } catch (err) {
        console.error("❌ getAllPosts error:", err);
        res.status(500).json({ message: err.message });
    }
};


// Lấy bài viết theo ID (Không yêu cầu đăng nhập)
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userIds = [post.userId.toString()];
        if (post.sharedPostId) {
            userIds.push(post.sharedPostId.toString());
        }

        // Lấy thông tin user từ user-service
        const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
            userIds
        });
        const userMap = {};
        userRes.data.forEach(user => {
            userMap[user.userId] = user;
        });

        // Gắn user info cho post
        const user = userMap[post.userId.toString()];
        let sharedPost = null;

        if (post.sharedPostId) {
            const shared = await Post.findById(post.sharedPostId);
            const sharedUser = userMap[shared.userId.toString()];
            sharedPost = {
                _id: shared._id,
                content: shared.content,
                media: shared.media,
                username: `${sharedUser?.firstname || "Anomyous"} ${sharedUser?.lastname || ""}`,
                avatar: sharedUser?.avatar || "https://picsum.photos/200"
            };
        }

        const postWithUser = {
            ...post.toObject(),
            username: `${user?.firstname || "Anomyous"} ${user?.lastname || ""}`,
            avatar: user?.avatar || "https://picsum.photos/200",
            sharedPost
        };

        res.json(postWithUser);
    } catch (err) {
        console.error("❌ getPostById error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Lấy bài viết theo userId (Yêu cầu đăng nhập)
const getPostsByUser = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: "Missing userId" });

        const posts = await Post.find({ userId }).sort({ createdAt: -1 });

        // 🧠 Tìm tất cả sharedPostId để truy xuất post gốc
        const sharedPostIds = posts
            .filter(p => p.sharedPostId)
            .map(p => p.sharedPostId.toString());

        // Truy xuất các post gốc (shared)
        const sharedPosts = await Post.find({ _id: { $in: sharedPostIds } });

        // Tập hợp tất cả userId: user của post + user của sharedPost
        const allUserIds = [
            ...new Set([
                ...posts.map(p => p.userId.toString()),
                ...sharedPosts.map(sp => sp.userId.toString()),
            ])
        ];
        if (allUserIds.length === 0) {
            return res.json([]); // Không có post nào ⇒ trả về mảng rỗng
        }
        const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
            userIds: allUserIds
        });

        const userMap = {};
        userRes.data.forEach(user => {
            userMap[user.userId] = user;
        });

        const sharedPostMap = {};
        sharedPosts.forEach(sp => {
            sharedPostMap[sp._id] = {
                _id: sp._id,
                content: sp.content,
                media: sp.media,
                username: `${userMap[sp.userId]?.firstname || "Anomyous"} ${userMap[sp.userId]?.lastname || ""}`,
                avatar: userMap[sp.userId]?.avatar || "https://picsum.photos/200"
            };
        });

        const postsWithShared = posts.map(post => ({
            ...post.toObject(),
            username: `${userMap[post.userId]?.firstname || "Anomyous"} ${userMap[post.userId]?.lastname || ""}`,
            avatar: userMap[post.userId]?.avatar || "https://picsum.photos/200",
            sharedPost: post.sharedPostId ? sharedPostMap[post.sharedPostId] : null
        }));

        res.json(postsWithShared);
    } catch (err) {
        console.error("❌ getPostsByUser error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Sửa bài viết (Yêu cầu đăng nhập & chỉ chủ sở hữu mới chỉnh sửa được)
const editPost = async (req, res) => {
    try {
        const userId = verifyToken(req);
        const { content, media, tags } = req.body;


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
        if (Array.isArray(tags)) {
            post.tags = tags;
        }
        await post.save();

        res.json({ message: 'Post updated successfully', post });
    } catch (err) {
        console.error("❌ editPost error:", err);
        res.status(err.status || 500).json({ message: err.message });
    }
};

const getPostStatistics = async (req, res) => {
    try {
        const totalPosts = await Post.countDocuments();

        // Bài viết hôm nay
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayPosts = await Post.countDocuments({ createdAt: { $gte: startOfToday } });

        const reportedPosts = await Post.countDocuments({ tags: "reported" });
        const hiddenPosts = await Post.countDocuments({ tags: "hidden" });

        // Biểu đồ 7 ngày gần nhất
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const from = new Date();
            from.setDate(from.getDate() - i);
            from.setHours(0, 0, 0, 0);

            const to = new Date(from);
            to.setDate(to.getDate() + 1);

            const count = await Post.countDocuments({
                createdAt: { $gte: from, $lt: to },
            });

            trendData.push({
                date: from.toLocaleDateString("vi-VN"),
                count,
            });
        }

        // Bài viết mới nhất
        const recentPostsRaw = await Post.find().sort({ createdAt: -1 }).limit(10);
        const userIds = recentPostsRaw.map(p => p.userId.toString());
        const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, { userIds });

        const userMap = {};
        userRes.data.forEach(u => userMap[u.userId] = u);

        const recentPosts = recentPostsRaw.map(p => ({
            _id: p._id,
            content: p.content,
            createdAt: p.createdAt,
            username: `${userMap[p.userId]?.firstname || "Anonymous"} ${userMap[p.userId]?.lastname || ""}`,
            status: p.tags.includes("reported")
                ? "reported"
                : p.tags.includes("hidden")
                    ? "hidden"
                    : "active",
        }));

        res.json({
            totalPosts,
            todayPosts,
            reportedPosts,
            hiddenPosts,
            postTrend: trendData,
            recentPosts,
        });
    } catch (err) {
        console.error("❌ getPostStatistics error:", err);
        res.status(500).json({ message: "Failed to load statistics" });
    }
};

const getTopPostStats = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(50);

        const postIds = posts.map((p) => p._id.toString());
        const userIds = [...new Set(posts.map((p) => p.userId.toString()))];

        // Gọi các service để lấy số lượt like và comment
        const [likeRes, commentRes] = await Promise.all([
            axios.post(`${LIKE_SERVICE_URL}/likes/count-by-posts`, { postIds }),
            axios.post(`${CMT_SERVICE_URL}/comments/count-by-posts`, { postIds }),
        ]);

        const likeMap = likeRes.data || {};
        const commentMap = commentRes.data || {};

        // ✅ Đếm số lượt share dựa trên sharedPostId
        const shareCounts = await Post.aggregate([
            {
                $match: {
                    sharedPostId: { $in: postIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $group: {
                    _id: "$sharedPostId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const shareMap = {};
        shareCounts.forEach(item => {
            shareMap[item._id.toString()] = item.count;
        });

        // Lấy thông tin user
        const userRes = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, {
            userIds,
        });

        const users = Array.isArray(userRes.data) ? userRes.data : userRes.data.users || [];
        const userMap = {};
        users.forEach((user) => {
            const key = user.userId || user._id?.toString();
            if (key) {
                userMap[key] = `${user.firstname || ""} ${user.lastname || ""}`.trim();
            }
        });

        // Gộp dữ liệu vào từng bài post
        const enrichedPosts = posts.map((post) => ({
            id: post._id.toString(),
            user: userMap[post.userId.toString()] || "Unknown",
            content: post.content,
            likes: likeMap[post._id.toString()] || 0,
            comments: commentMap[post._id.toString()] || 0,
            shares: shareMap[post._id.toString()] || 0,
        }));

        // Lấy top 5 mỗi loại
        const topLikedPosts = [...enrichedPosts].sort((a, b) => b.likes - a.likes).slice(0, 5);
        const topCommentedPosts = [...enrichedPosts].sort((a, b) => b.comments - a.comments).slice(0, 5);
        const topSharedPosts = [...enrichedPosts].sort((a, b) => b.shares - a.shares).slice(0, 5);

        res.json({
            topLikedPosts,
            topCommentedPosts,
            topSharedPosts,
        });
    } catch (err) {
        console.error("❌ getTopPostStats error:", err.message);
        res.status(500).json({ message: "Failed to fetch top stats", detail: err.message });
    }
};

module.exports = { createPost, getAllPosts, getPostById, deletePost, getPostsByUser, editPost, getPostStatistics, getTopPostStats };
