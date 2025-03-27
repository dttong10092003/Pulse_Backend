const express = require('express');
const {
    checkUserExists,
    registerUserWithPhone,
    handleGoogleLogin,
    loginUser,
    authenticateToken,
    checkEmailOrPhoneExists,
    sendResetPasswordToEmail,
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

// Kiểm tra email hoặc số điện thoại đã tồn tại
router.post('/check-email-phone', checkEmailOrPhoneExists);

// Send reset password link to email
router.post('/send-reset-email', sendResetPasswordToEmail);


module.exports = router;
