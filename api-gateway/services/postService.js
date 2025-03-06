const axios = require("axios");

const POST_SERVICE_URL = process.env.POST_SERVICE_URL;

const createPost = async (req, res) => {
  try {
    const response = await axios.post(`${POST_SERVICE_URL}/`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const response = await axios.get(`${POST_SERVICE_URL}/`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const response = await axios.delete(`${POST_SERVICE_URL}/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

module.exports = { createPost, getPosts, deletePost };
