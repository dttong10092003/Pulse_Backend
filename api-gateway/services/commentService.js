const axios = require("axios");

const CMT_SERVICE_URL = process.env.CMT_SERVICE_URL;

const createComment = async (req, res) => {
  try {
    const response = await axios.post(`${CMT_SERVICE_URL}/comments`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const response = await axios.get(`${CMT_SERVICE_URL}/comments/${req.params.postId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const addReplyToComment = async (req, res) => {
  try {
    const response = await axios.post(`${CMT_SERVICE_URL}/comments/reply/${req.params.commentId}`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

module.exports = { createComment, getCommentsByPost, addReplyToComment };
