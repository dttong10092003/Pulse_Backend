const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

const getUser = async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const response = await axios.put(`${USER_SERVICE_URL}/users/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
};

const createUserDetail = async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/users`, req.body, {
      headers: { Authorization: req.headers.authorization }, // Thêm token vào headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error in createUserDetail:", error.response?.data || error.message); // Debug lỗi
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

module.exports = { getUser, updateUser, createUserDetail };
