// auth-service/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Kiểm tra số điện thoại hoặc email đã tồn tại chưa
const checkUserExists = async (req, res) => {
    try {
        const { phoneNumber, username } = req.body;
        const existingUser = await User.findOne({ $or: [{ phoneNumber }, { username }] });

        if (existingUser) {
            return res.status(400).json({ message: 'Phone number or Email already in use' });
        }
        return res.status(200).json({ message: 'Available for registration' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// Đăng ký bằng số điện thoại + username + password
const registerUserWithPhone = async (req, res) => {
    try {
        const { phoneNumber, username, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ phoneNumber }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number or Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ phoneNumber, username, password: hashedPassword, isVerified: true });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: newUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Đăng ký / Đăng nhập bằng Google OAuth2
const handleGoogleLogin = async (req, res) => {
    try {
        const { email, googleId } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            // Nếu user đã có tài khoản, đăng nhập luôn
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ token, user });
        }

        // Nếu user chưa có tài khoản, tạo mới
        user = new User({ email, googleId, isVerified: false });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user, message: "Please enter phone number to verify" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Đăng nhập bằng username/password
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

module.exports = {
    checkUserExists,
    registerUserWithPhone,
    handleGoogleLogin,
    loginUser,
    authenticateToken
};
