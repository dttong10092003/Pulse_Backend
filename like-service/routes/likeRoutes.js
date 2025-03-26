const express = require('express');
const { likePost, unlikePost, getLikeCount, getUsersWhoLiked } = require('../controllers/likeController');

const router = express.Router();

router.post('/:postId', likePost);
router.delete('/:postId', unlikePost);
router.get('/count/:postId', getLikeCount);
router.get('/:postId', getUsersWhoLiked);

module.exports = router;