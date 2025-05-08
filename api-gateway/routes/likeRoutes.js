const express = require("express");
const router = express.Router();
const likeService = require("../services/likeService");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/user-liked-posts", authenticateToken, likeService.getUserLikedPosts);
router.post("/:postId", authenticateToken, likeService.likePost);
router.delete("/:postId", authenticateToken, likeService.unlikePost);
router.get("/count/:postId", likeService.getLikeCount);
router.get("/:postId", likeService.getUsersWhoLiked);
router.post("/count-by-posts", likeService.getLikeCountsByPosts);

module.exports = router;
