const express = require('express');
const router = express.Router();

// Đảm bảo rằng bạn đã import đúng các controller
const { followUser, unfollowUser, getFollowers, getFollowings } = require('../controllers/followController');

// Các route sử dụng đúng các controller
router.post('/', followUser);
router.post('/unfollow', unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/followings/:userId', getFollowings);

module.exports = router;
