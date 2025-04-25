const express = require('express');
const {
  createComment,
  getCommentsByPost,
  addReplyToComment,
  getCommentCountsByPosts, // 🆕 Thêm controller mới
} = require('../controllers/commentController');

const router = express.Router();

router.post('/', createComment); // Tạo comment
router.get('/:postId', getCommentsByPost); // Lấy comment theo postId
router.post('/reply/:commentId', addReplyToComment); // Trả lời comment
router.post('/count-by-posts', getCommentCountsByPosts); // 🆕 Lấy số lượng comment theo nhiều post

module.exports = router;
