const express = require("express");
const router = express.Router();
const commentService = require("../services/commentService"); // ✅ import từ services
const { authenticateToken } = require("../middleware/authMiddleware");

// Comment
router.post("/", authenticateToken, commentService.createComment);
router.get("/:postId", commentService.getCommentsByPost);
router.post("/reply/:commentId", authenticateToken, commentService.addReplyToComment);
router.post("/count-by-posts", commentService.getCommentCountsByPosts);

module.exports = router;
