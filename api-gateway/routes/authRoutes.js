const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

router.post("/check-user", authService.checkUser);
router.post("/register/phone", authService.registerWithPhone);
router.post("/login/google", authService.loginWithGoogle);
router.post("/login", authService.loginWithUsername);

module.exports = router;
