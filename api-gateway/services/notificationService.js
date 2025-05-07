const axios = require("axios");

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL; // http://localhost:5007

// ✅ GET /noti/all?userId=...
const getAllNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/noti/get-all?userId=${userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error in getAllNotifications:", error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};



// ✅ PATCH /noti/markOne/:id  (body: { userId })
const markOneAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const response = await axios.patch(`${NOTIFICATION_SERVICE_URL}/noti/read-one/${req.params.id}`, { userId });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error in markOneAsRead:", error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};

// ✅ PATCH /noti/markMany  (body: { ids: [], userId })
const markManyAsRead = async (req, res) => {
  try {
    const { ids, userId } = req.body;
    if (!Array.isArray(ids) || !userId) {
      return res.status(400).json({ message: "Missing ids or userId" });
    }

    const response = await axios.patch(`${NOTIFICATION_SERVICE_URL}/noti/read-all`, { ids, userId });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error in markManyAsRead:", error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};

// ✅ POST /noti/create  (body: { type, receiverId, senderId, ... })
const createNotification = async (req, res) => {
  try {
    const payload = req.body;

    const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/noti/create`, payload);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error in createNotification:", error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};

module.exports = {
  getAllNotifications,
  markOneAsRead,
  markManyAsRead,
  createNotification,
};
