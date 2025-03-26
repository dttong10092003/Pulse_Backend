const express = require('express');
const { createComment, getCommentsByPost, addReplyToComment } = require('../controllers/commentController');

const router = express.Router();

router.post('/', createComment);
router.get('/:postId', getCommentsByPost);
router.post('/reply/:commentId', addReplyToComment);

module.exports = router;