const express = require('express');
const {
    checkUserExists,
    registerUserWithPhone,
    handleGoogleLoginRegister,
    loginUser,
    authenticateToken,
    checkEmailOrPhoneExists,
    sendResetPasswordToEmail,
    resetPasswordWithToken,
    resetPasswordWithPhone,
    getMe,
    getUsernameById,
    sendEmailOtp,
    verifyEmailOtp,
    loginGoogle,
    changePassword,
    getBatchUsernames,
    getPhoneNumber,
    getBatchUserDetails,
    autoBanAndUnbanUsers,increaseReportCount
} = require('../controllers/authController');

const router = express.Router();

// Kiểm tra số điện thoại hoặc email trước khi tạo tài khoản
router.post('/check-user', checkUserExists);

// Đăng ký bằng số điện thoại
router.post('/register/phone', registerUserWithPhone);

// Đăng ký / Đăng nhập bằng Google OAuth2
router.post('/register/google', handleGoogleLoginRegister);

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

// Kiểm tra token reset password
router.post('/reset-password', resetPasswordWithToken); 

router.post('/reset-password-phone', resetPasswordWithPhone); // Phone number

router.get("/me", getMe);

// Lấy username từ userId
router.get('/username/:id', getUsernameById);

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

router.post('/login/google', loginGoogle); // dùng khi Login

router.post('/change-password',changePassword );

router.post('/batch-usernames', getBatchUsernames);

router.get('/phone', getPhoneNumber); // dùng khi Login

router.post('/getDetailUser',getBatchUserDetails)
router.post('/increase-report/:userId', increaseReportCount); // dùng khi Login
module.exports = router;
