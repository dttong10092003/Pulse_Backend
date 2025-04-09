const axios = require('axios');
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

// 🔔 1. Lấy 10 thông báo gần nhất
const getRecentNotifications = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/noti/ListRecent`, {
            headers: { Authorization: token }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

// 🔔 2. Lấy tất cả thông báo
const getAllNotifications = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/noti/ListNotification`, {
            headers: { Authorization: token }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

// 🔔 3. Đánh dấu một thông báo đã đọc
const markOneAsRead = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { id } = req.params;
        const response = await axios.patch(`${NOTIFICATION_SERVICE_URL}/noti/MarkOne/${id}`, {}, {
            headers: { Authorization: token }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

// 🔔 4. Đánh dấu nhiều thông báo đã đọc
const markManyAsRead = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await axios.patch(`${NOTIFICATION_SERVICE_URL}/noti/MarkMany`, req.body, {
            headers: { Authorization: token }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

// 🔔 5. Tạo thông báo mới
const createNotification = async (req, res) => {
    try {
        const token = req.headers.authorization;
        const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/noti/Create`, req.body, {
            headers: { Authorization: token }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
};

module.exports = {
    getRecentNotifications,
    getAllNotifications,
    markOneAsRead,
    markManyAsRead,
    createNotification
};
