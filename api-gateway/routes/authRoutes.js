const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

router.post("/check-user", authService.checkUser);
router.post("/register/phone", authService.registerWithPhone);
router.post("/login/google", authService.loginWithGoogle);
router.post("/login", authService.loginWithUsername);
router.post("/check-email-phone", authService.checkEmailOrPhone);
router.post("/send-reset-email", authService.sendResetPasswordToEmail);
router.post("/reset-password", authService.resetPasswordWithToken);
router.post("/reset-password-phone", authService.resetPasswordWithPhone);
router.get("/me", authService.getMe);
router.get("/username/:id", authService.getUsernameById);
module.exports = router;
