const jwt = require('jsonwebtoken');
const UserDetail = require('../models/userDetail');
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
// Lấy thông tin user theo ID
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
const createUserDetail = async (req, res) => {
    try {
        console.log('Data received from frontend:', req.body);
        const userId = verifyToken(req); // Lấy userId từ token
        console.log("✅ User ID from token:", userId);

        const { firstname, lastname, dob, gender, phoneNumber, email, address, bio, avatar, backgroundAvatar } = req.body;

        const existingUser = await UserDetail.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ message: 'User detail already exists' });
        }

        let userDetailData = { userId, firstname, lastname, DOB: dob, gender, address, bio, avatar, backgroundAvatar };
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
        user.avatar = avatar || user.avatar;
        user.backgroundAvatar = backgroundAvatar || user.backgroundAvatar;

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
  



module.exports = { getUserById, updateUser, createUserDetail, checkEmailOrPhoneExists, getUserByEmail };
