const express = require('express');
const { getUserById, updateUser, createUserDetail } = require('../controllers/userController');

const router = express.Router();

router.get('/:id', getUserById); // Lấy user theo ID
router.put('/:id', updateUser); // Cập nhật user (yêu cầu đăng nhập)
router.post('/', createUserDetail); // Tạo user khi đăng ký

module.exports = router;
