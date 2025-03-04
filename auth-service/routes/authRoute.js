// auth-service/routes/authRoute.js
const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// Đăng ký người dùng
router.post('/register', registerUser);

// Đăng nhập người dùng
router.post('/login', loginUser);

module.exports = router;
