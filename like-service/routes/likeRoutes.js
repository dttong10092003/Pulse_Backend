const express = require('express');
const { likePost, unlikePost, getUsersWhoLiked, getUserLikedPosts,getLikeCountsByPosts } = require('../controllers/likeController');

const router = express.Router();

router.get('/user-liked-posts', getUserLikedPosts);
router.post('/:postId', likePost);
router.delete('/:postId', unlikePost);
router.get('/:postId', getUsersWhoLiked);
router.post('/count-by-posts', getLikeCountsByPosts);
module.exports = router;