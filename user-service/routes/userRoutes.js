const express = require('express');
const { getUserById, updateUser, createUserDetail, checkEmailOrPhoneExists, getUserByEmail } = require('../controllers/userController');

const router = express.Router();

router.get('/:id', getUserById); // Lấy user theo ID
router.put('/:id', updateUser); // Cập nhật user (yêu cầu đăng nhập)
router.post('/', createUserDetail); // Tạo user khi đăng ký
router.post('/check-email-phone', checkEmailOrPhoneExists); // Kiểm tra email hoặc số điện thoại đã tồn tại
// Thêm route mới để lấy thông tin người dùng qua email
router.get('/user-details/:email', getUserByEmail);
module.exports = router;
