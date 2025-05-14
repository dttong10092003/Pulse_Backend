const jwt = require('jsonwebtoken');
const UserDetail = require('../models/userDetail'); // Import model UserDetail
const mongoose = require('mongoose');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL
const axios = require("axios");
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const FOLLOW_SERVICE_URL = process.env.FOLLOW_SERVICE_URL;

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
// // Lấy thông tin user theo ID
const getUserById = async (req, res) => {
    try {
        const user = await UserDetail.findOne({ userId: req.params.id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// const getUserById = async (req, res) => {
//     try {
//       const userId = req.params.id;

//       // 1. Tìm UserDetail theo userId
//       const userDetail = await UserDetail.findOne({ userId });
//       if (!userDetail) {
//         return res.status(404).json({ message: "User not found in UserDetail" });
//       }

//       // 2. Gọi sang auth-service để lấy username
//       const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:5000";
//       let username = "";

//       try {
//         const response = await axios.get(`${authServiceUrl}/auth/username/${userId}`);
//         username = response.data.username || "";
//       } catch (err) {
//         console.error("Failed to fetch username from auth-service:", err.message);
//       }

//       // 3. Gộp kết quả trả về: username + các trường từ UserDetail
//       res.json({
//         ...userDetail.toObject(),
//         username,
//       });

//     } catch (err) {
//       console.error("getUserById error:", err.message);
//       res.status(500).json({ message: err.message });
//     }
//   };
const createUserDetail = async (req, res) => {
    try {
        console.log('Data received from frontend:', req.body);
        const userId = verifyToken(req); // Lấy userId từ token
        console.log("✅ User ID from token:", userId);

        const { firstname, lastname, dob, gender, phoneNumber, email, address, bio, avatar, backgroundAvatar } = req.body;
        const finalAvatar = avatar || 'https://i.postimg.cc/7Y7ypVD2/avatar-mac-dinh.jpg';
        const finalBackgroundAvatar = backgroundAvatar || 'https://i.postimg.cc/6pXNwv51/backgrond-mac-dinh.jpg';
        const existingUser = await UserDetail.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ message: 'User detail already exists' });
        }

        let userDetailData = { userId, firstname, lastname, DOB: dob, gender, address, bio, avatar: finalAvatar, backgroundAvatar: finalBackgroundAvatar };
        if (phoneNumber) {
            userDetailData.phoneNumber = phoneNumber;
        }

        if (email) {
            userDetailData.email = email;
        }

        if (!phoneNumber && !email) {
            return res.status(400).json({ message: 'Either phoneNumber or email is required' });
        }

        const newUser = new UserDetail(userDetailData);
        await newUser.save();

        res.status(201).json({ message: 'User detail created successfully', newUser });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
const updateUser = async (req, res) => {
    try {
        const { firstname, lastname, dob, gender, phoneNumber, email, address, bio, avatar, backgroundAvatar } = req.body;
        const userId = req.params.id;

        let user = await UserDetail.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstname = firstname || user.firstname;
        user.lastname = lastname || user.lastname;
        user.DOB = dob || user.DOB;
        user.gender = gender || user.gender;

        if (phoneNumber) {
            user.phoneNumber = phoneNumber;
        }
        if (email) {
            user.email = email;
        }

        user.address = address || user.address;
        user.bio = bio || user.bio;
        // Tạo danh sách các tác vụ xử lý song song
        const promises = [];

        // Avatar
        if (avatar?.startsWith("data:image/")) {
            if (user.avatar?.includes("res.cloudinary.com") && !user.avatar.includes("mac-dinh")) {
                promises.push(deleteFromCloudinary(user.avatar));
            }
            promises.push(
                uploadToCloudinary(avatar, 'avatars').then((url) => {
                    user.avatar = url;
                })
            );
        }

        // Background
        if (backgroundAvatar?.startsWith("data:image/")) {
            if (user.backgroundAvatar?.includes("res.cloudinary.com") && !user.backgroundAvatar.includes("mac-dinh")) {
                promises.push(deleteFromCloudinary(user.backgroundAvatar));
            }
            promises.push(
                uploadToCloudinary(backgroundAvatar, 'backgrounds').then((url) => {
                    user.backgroundAvatar = url;
                })
            );
        }

        // Thực hiện tất cả thao tác xoá và upload ảnh song song
        await Promise.all(promises);

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const checkEmailOrPhoneExists = async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({ error: 'Missing email or phoneNumber' });
        }

        const conditions = [];
        if (email) conditions.push({ email: email.trim() });
        if (phoneNumber) conditions.push({ phoneNumber: phoneNumber.trim() });

        // Kiểm tra trong model UserDetail của user-service
        const existingUserDetail = await UserDetail.findOne({ $or: conditions });

        if (existingUserDetail) {
            return res.status(200).json({ exists: true });
        }

        return res.status(200).json({ exists: false });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;  // Lấy email từ params

        // Tìm người dùng trong UserDetail dựa trên email
        const userDetail = await UserDetail.findOne({ email: email.trim() });

        if (!userDetail) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Trả về thông tin người dùng, bao gồm cả userId
        res.json({
            userId: userDetail.userId,  // Trả về userId cho auth-service để cập nhật mật khẩu
            email: userDetail.email,
            phoneNumber: userDetail.phoneNumber,
            firstname: userDetail.firstname,
            lastname: userDetail.lastname,
            // Các thông tin khác nếu cần
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// Tìm danh sách UserDetail từ danh sách userId
const getUserDetailsByIds = async (req, res) => {
    try {
        const { userIds } = req.body; // Lấy danh sách userIds từ body

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'Invalid userIds array' });
        }

        // Tìm tất cả user details có userId nằm trong danh sách userIds
        const users = await UserDetail.find({ userId: { $in: userIds } });

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // Trả về danh sách user details
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getTop10Users = async (req, res) => {
    try {
        const { excludeUserId } = req.query;
        // Kiểm tra excludeUserId hợp lệ
        let filter = {};
        if (excludeUserId) {
            filter = { userId: { $ne: new mongoose.Types.ObjectId(excludeUserId) } };
        }

        // Lấy danh sách UserDetail
        const userDetails = await UserDetail.find(filter)
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();
        if (!userDetails.length) {
            return res.status(404).json({ message: "No users found" });
        }
        const userIds = userDetails.map((u) => u.userId);

        // Nếu userIds rỗng, return luôn
        if (userIds.length === 0) {
            return res.status(404).json({ message: "No user IDs found" });
        }
        // Gọi auth-service để lấy danh sách username theo userId
        const authResponse = await axios.post(`${AUTH_SERVICE_URL}/auth/batch-usernames`, {
            userIds,
        });
        if (!authResponse.data) {
            return res.status(500).json({ message: "Failed to fetch user details from auth-service" });
        }
        const userMap = authResponse.data; // { userId: username, ... }
        // Gộp dữ liệu và trả về
        const result = userDetails.map((detail) => ({
            _id: detail.userId?.toString(),
            firstname: detail.firstname,
            lastname: detail.lastname,
            avatar: detail.avatar,
            username: userMap[detail.userId?.toString()] || "unknown",
        }));
        res.status(200).json(result);
    } catch (err) {
        console.error("❌ Error in user-service getTop10Users:", err);
        res.status(500).json({ message: "Failed to fetch top 10 users" });
    }
};

const getUserDetails = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId param.' });
    }

    try {
        const user = await UserDetail.findOne({ userId }).select('firstname lastname avatar');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'User details retrieved successfully.',
            data: {
                firstname: user.firstname,
                lastname: user.lastname,
                avatar: user.avatar,
            }
        });
    } catch (error) {
        console.error("Error in getUserDetails:", error);
        return res.status(500).json({
            message: 'Internal server error.',
            error: error.message
        });
    }
};

const getTopUsersExcludingFollowed = async (req, res) => {
    try {
        const { excludeUserId } = req.query;

        if (!excludeUserId || !mongoose.Types.ObjectId.isValid(excludeUserId)) {
            return res.status(400).json({ message: "Invalid excludeUserId" });
        }

        const followRes = await axios.get(`${FOLLOW_SERVICE_URL}/follow/followings/${excludeUserId}`);

        const followings = followRes.data?.data || [];

        const followingIds = followings.map(f => f.user._id);

        const userDetails = await UserDetail.find({
            userId: {
                $ne: new mongoose.Types.ObjectId(excludeUserId),
                $nin: followingIds.map(id => new mongoose.Types.ObjectId(id))
            }
        }).sort({ createdAt: -1 }).lean();

        const userIds = userDetails.map((u) => u.userId);

        // Nếu không có user nào => return luôn
        if (userIds.length === 0) {
            return res.status(200).json([]);  // Trả về mảng rỗng thay vì gọi auth-service
        }

        const authResponse = await axios.post(`${AUTH_SERVICE_URL}/auth/batch-usernames`, { userIds });
        const userMap = authResponse.data;

        const result = userDetails.map((detail) => ({
            _id: detail.userId.toString(),
            firstname: detail.firstname,
            lastname: detail.lastname,
            avatar: detail.avatar,
            username: userMap[detail.userId.toString()] || "unknown",
        }));

        return res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error in getTopUsersExcludingFollowed:", error);
        return res.status(500).json({ message: "Failed to fetch suggested users." });
    }
};
const getAllUsers = async (req, res) => {
    try {
        const userDetails = await UserDetail.find().sort({ createdAt: -1 });

        const userIds = userDetails.map(user => user.userId);
        if (userIds.length === 0) {
            return res.status(200).json([]);
        }

        const authResponse = await axios.post(`${AUTH_SERVICE_URL}/auth/batch-usernames`, { userIds });
        const userMap = authResponse.data;

        const result = userDetails.map(user => ({
            _id: user.userId.toString(),
            firstname: user.firstname,
            lastname: user.lastname,
            avatar: user.avatar,
            username: userMap[user.userId.toString()] || "unknown",
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error in getAllUsers:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

module.exports = { getTopUsersExcludingFollowed, getUserById, updateUser, createUserDetail, checkEmailOrPhoneExists, getUserByEmail, getUserDetailsByIds, getTop10Users, getUserDetails, getAllUsers };
