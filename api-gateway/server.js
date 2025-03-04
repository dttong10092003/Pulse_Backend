const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// Định tuyến cho Auth Service (Đăng ký)
app.post('/auth/register', async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/register`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Định tuyến cho Auth Service (Đăng nhập)
app.post('/auth/login', async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/login`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
