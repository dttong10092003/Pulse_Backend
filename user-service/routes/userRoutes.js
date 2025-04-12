const express = require('express');
const { getUserById, updateUser, createUserDetail, checkEmailOrPhoneExists, getUserByEmail, getUserDetailsByIds,getTop10Users } = require('../controllers/userController');

const router = express.Router();

router.get('/top10-users', getTop10Users); // Lấy danh sách 10 người dùng
router.get('/:id', getUserById); // Lấy user theo ID
router.put('/:id', updateUser); // Cập nhật user (yêu cầu đăng nhập)
router.post('/', createUserDetail); // Tạo user khi đăng ký
router.post('/check-email-phone', checkEmailOrPhoneExists); // Kiểm tra email hoặc số điện thoại đã tồn tại
// Thêm route mới để lấy thông tin người dùng qua email
router.get('/user-details/:email', getUserByEmail);

// Thêm route mới để lấy danh sách UserDetail từ danh sách userId
router.post('/user-details-by-ids', getUserDetailsByIds);

// Thêm route mới để lấy danh sách 10 người dùng


module.exports = router;
