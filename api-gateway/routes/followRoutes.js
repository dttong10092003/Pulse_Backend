const express = require("express");
const router = express.Router();
const followService = require("../services/followService");
const { authenticateToken } = require("../middleware/authMiddleware");

// Follow / Unfollow
router.post("/", followService.followUser);
router.post("/unfollow", followService.unfollowUser);

// Get followers / followings
router.get("/followers/:userId", followService.getFollowers);
router.get("/followings/:userId", followService.getFollowings);

module.exports = router;
