const axios = require("axios");

const POST_SERVICE_URL = process.env.POST_SERVICE_URL;

const createPost = async (req, res) => {
  try {
    const response = await axios.post(`${POST_SERVICE_URL}/posts`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const response = await axios.get(`${POST_SERVICE_URL}/posts`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};
const getPostById = async (req, res) => {
  try {
    const response = await axios.get(`${POST_SERVICE_URL}/posts/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const deletePost = async (req, res) => {
  try {
    const response = await axios.delete(`${POST_SERVICE_URL}/posts/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.query;
    const response = await axios.get(`${POST_SERVICE_URL}/posts/user/posts?userId=${userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const editPost = async (req, res) => {
  try {
    const response = await axios.put(`${POST_SERVICE_URL}/posts/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const getPostStatistics = async (req, res) => {
  try {
    const response = await axios.get(`${POST_SERVICE_URL}/posts/admin/statistics`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json({ error: error.response?.data?.message || error.message });
  }
};

module.exports = { createPost, getPosts, deletePost, getPostById, getUserPosts, editPost, getPostStatistics };
