const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const POST_SERVICE_URL = process.env.POST_SERVICE_URL;

// Định tuyến cho Auth Service (Đăng ký)
app.post("/auth/register", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/register`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Định tuyến cho Auth Service (Đăng nhập)
app.post("/auth/login", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/login`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Định tuyến cho Post Service (Tạo bài viết - CẦN token)
app.post("/posts", async (req, res) => {
    try {
      console.log("🔹 Token received in API Gateway:", req.headers.authorization); // Debug token tại API Gateway
  
      const response = await axios.post(`${POST_SERVICE_URL}/`, req.body, {
        headers: { Authorization: req.headers.authorization },
      });
  
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
    }
  });
  
  
  // Định tuyến cho Post Service (Lấy danh sách bài viết - KHÔNG cần token)
  app.get("/posts", async (req, res) => {
    try {
      const response = await axios.get(`${POST_SERVICE_URL}/`);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
    }
  });
  
  // Định tuyến cho Post Service (Lấy bài viết theo ID - KHÔNG cần token)
  app.get("/posts/:id", async (req, res) => {
    try {
      const response = await axios.get(`${POST_SERVICE_URL}/${req.params.id}`);
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
    }
  });
  
  // Định tuyến cho Post Service (Xóa bài viết - CẦN token)
  app.delete("/posts/:id", async (req, res) => {
    try {
      const response = await axios.delete(`${POST_SERVICE_URL}/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }, // Chuyển tiếp token
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
