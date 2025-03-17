const express = require("express");
const router = express.Router();
const commentService = require("../services/commentService");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/", authenticateToken, commentService.createComment);
router.get("/:postId", commentService.getCommentsByPost);
router.post("/reply/:commentId", authenticateToken, commentService.addReplyToComment);

module.exports = router;
