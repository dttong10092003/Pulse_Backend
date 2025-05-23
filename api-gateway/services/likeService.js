
const axios = require("axios");

const LIKE_SERVICE_URL = process.env.LIKE_SERVICE_URL;

const likePost = async (req, res) => {
  try {
    const response = await axios.post(
      `${LIKE_SERVICE_URL}/likes/${req.params.postId}`,
      {},
      {
        headers: { Authorization: req.headers.authorization },
      }
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const unlikePost = async (req, res) => {
  try {
    const response = await axios.delete(`${LIKE_SERVICE_URL}/likes/${req.params.postId}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};



const getUsersWhoLiked = async (req, res) => {
  try {
    const response = await axios.get(`${LIKE_SERVICE_URL}/likes/${req.params.postId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const getUserLikedPosts = async (req, res) => {
  
    try {
      const response = await axios.get(`${LIKE_SERVICE_URL}/likes/user-liked-posts`, {
        headers: { Authorization: req.headers.authorization },
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
    }
  }

  const getLikeCountsByPosts = async (req, res) => {
    try {
      // ✅ Không gửi headers.Authorization vì route này không yêu cầu xác thực
      const response = await axios.post(`${LIKE_SERVICE_URL}/likes/count-by-posts`, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
    }
  };
  
module.exports = { likePost, unlikePost, getUsersWhoLiked, getUserLikedPosts, getLikeCountsByPosts };
