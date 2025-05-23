const express = require("express");
const router = express.Router();
const postService = require("../services/postService");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/admin/statistics", postService.getPostStatistics);
router.get("/admin/top-stats", postService.getTopPostStats);
router.post("/", authenticateToken, postService.createPost);
router.get("/", postService.getPosts);
router.delete("/:id", authenticateToken, postService.deletePost);
router.get("/:id", postService.getPostById);
router.get("/user/posts", postService.getUserPosts);
router.put("/:id", authenticateToken, postService.editPost);


module.exports = router;
