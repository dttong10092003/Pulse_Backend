const express = require('express');
const { createPost, getAllPosts, getPostById, deletePost, getPostsByUser,editPost, getPostStatistics, getTopPostStats  } = require('../controllers/postController');

const router = express.Router();

router.get('/admin/top-stats', getTopPostStats);
router.get('/admin/statistics', getPostStatistics);
router.post('/', createPost); // Cần login (Xác thực trong controller)
router.get('/', getAllPosts); // Không cần login
router.get('/:id', getPostById); // Không cần login
router.delete('/:id', deletePost); // Cần login (Xác thực trong controller)
router.get('/user/posts', getPostsByUser); // → /posts/user/posts?userId=xxx
router.put('/:id', editPost);

module.exports = router;
