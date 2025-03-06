const express = require('express');
const {
    checkUserExists,
    registerUserWithPhone,
    handleGoogleLogin,
    loginUser,
    authenticateToken
} = require('../controllers/authController');

const router = express.Router();

// Kiểm tra số điện thoại hoặc email trước khi tạo tài khoản
router.post('/check-user', checkUserExists);

// Đăng ký bằng số điện thoại
router.post('/register/phone', registerUserWithPhone);

// Đăng ký / Đăng nhập bằng Google OAuth2
router.post('/login/google', handleGoogleLogin);

// Đăng nhập bằng username/password
router.post('/login', loginUser);

// Route yêu cầu xác thực token
router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ message: 'Token is valid', user: req.user });
});

module.exports = router;
