const express = require("express");
const router = express.Router();
const postService = require("../services/postService");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/", authenticateToken, postService.createPost);
router.get("/", postService.getPosts);
router.delete("/:id", authenticateToken, postService.deletePost);
router.get("/:id", postService.getPostById);

module.exports = router;
