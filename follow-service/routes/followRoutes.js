const express = require('express');
const router = express.Router();

const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowings
} = require('../controllers/followController');

router.post('/', followUser);

router.post('/unfollow', unfollowUser);

router.get('/followers/:userId', getFollowers);

router.get('/followings/:userId', getFollowings);

module.exports = router;
