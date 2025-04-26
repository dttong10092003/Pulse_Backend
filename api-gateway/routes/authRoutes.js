const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

router.post("/check-user", authService.checkUser);
router.post("/register/phone", authService.registerWithPhone);
router.post("/register/google", authService.loginWithGoogleRegister);
router.post("/login", authService.loginWithUsername);
router.post("/check-email-phone", authService.checkEmailOrPhone);
router.post("/send-reset-email", authService.sendResetPasswordToEmail);
router.post("/reset-password", authService.resetPasswordWithToken);
router.post("/reset-password-phone", authService.resetPasswordWithPhone);
router.get("/me", authService.getMe);
router.get("/username/:id", authService.getUsernameById);
router.post("/send-email-otp", authService.sendEmailOtp);
router.post("/verify-email-otp", authService.verifyEmailOtp);
router.post("/login/google", authService.loginGoogle); // dùng khi Login
router.post("/change-password", authService.changePassword);
router.post("/batch-usernames", authService.getBatchUsernames); // Lấy danh sách username từ danh sách userId
router.get("/phone", authService.getPhoneNumber);

module.exports = router;
