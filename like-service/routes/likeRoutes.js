const express = require('express');
const { likePost, unlikePost, getLikeCount, getUsersWhoLiked, getUserLikedPosts } = require('../controllers/likeController');

const router = express.Router();

router.post('/:postId', likePost);
router.delete('/:postId', unlikePost);
router.get('/count/:postId', getLikeCount);
router.get('/:postId', getUsersWhoLiked);
router.get('/user-liked-posts', getUserLikedPosts);

module.exports = router;