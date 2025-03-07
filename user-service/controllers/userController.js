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

// Cập nhật thông tin user (phải đăng nhập)
const updateUser = async (req, res) => {
    try {
        const { firstname, lastname, DOB, gender, phoneNumber, email, address, bio } = req.body;
        const userId = req.params.id;

        let user = await UserDetail.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.firstname = firstname || user.firstname;
        user.lastname = lastname || user.lastname;
        user.DOB = DOB || user.DOB;
        user.gender = gender || user.gender;
        
        if (phoneNumber) {
            user.phoneNumber = phoneNumber;
            user.email = undefined;
        } else if (email) {
            user.email = email;
            user.phoneNumber = undefined;
        }
        
        user.address = address || user.address;
        user.bio = bio || user.bio;

        await user.save();
        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Tạo thông tin user (khi đăng ký xong từ auth-service)
const createUserDetail = async (req, res) => {
    try {
        const userId = verifyToken(req); // Lấy userId từ token
        console.log("✅ User ID from token:", userId);
        const { firstname, lastname, DOB, gender, phoneNumber, email, address, bio } = req.body;

        const existingUser = await UserDetail.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ message: 'User detail already exists' });
        }

        let userDetailData = { userId, firstname, lastname, DOB, gender, address, bio };
        
        if (phoneNumber) {
            userDetailData.phoneNumber = phoneNumber;
        } else if (email) {
            userDetailData.email = email;
        } else {
            return res.status(400).json({ message: 'Either phoneNumber or email is required' });
        }

        const newUser = new UserDetail(userDetailData);
        await newUser.save();

        res.status(201).json({ message: 'User detail created successfully', newUser });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

module.exports = { getUserById, updateUser, createUserDetail };
