
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

const getLikeCount = async (req, res) => {
  try {
    const response = await axios.get(`${LIKE_SERVICE_URL}/likes/count/${req.params.postId}`);
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

module.exports = { likePost, unlikePost, getLikeCount, getUsersWhoLiked };
