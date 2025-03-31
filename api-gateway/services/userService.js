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

const checkEmailOrPhoneExists = async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/users/check-email-phone`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
};
const getUserByEmail = async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/user-details/${req.params.email}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
}

const getUserDetailsByIds = async (req, res) => {
  try {
    const { userIds } = req.body; // Lấy danh sách userIds từ body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid userIds array' });
    }

    // Tìm tất cả user details có userId nằm trong danh sách userIds
    const users = await axios.post(`${USER_SERVICE_URL}/users/user-details-by-ids`, { userIds });

    if (users.data.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Trả về danh sách user details
    res.json(users.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUser, updateUser, createUserDetail, checkEmailOrPhoneExists, getUserByEmail, getUserDetailsByIds };
