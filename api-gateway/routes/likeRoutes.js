const express = require("express");
const router = express.Router();
const likeService = require("../services/likeService");
const { authenticateToken } = require("../middleware/authMiddleware");
router.post("/count-by-posts", likeService.getLikeCountsByPosts);
router.get("/count/:postId", likeService.getLikeCount);
router.get("/user-liked-posts", authenticateToken, likeService.getUserLikedPosts);
router.post("/:postId", authenticateToken, likeService.likePost);
router.delete("/:postId", authenticateToken, likeService.unlikePost);
router.get("/:postId", likeService.getUsersWhoLiked);

module.exports = router;
