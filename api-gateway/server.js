const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const POST_SERVICE_URL = process.env.POST_SERVICE_URL;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

// Middleware xác thực JWT (Dùng cho các API cần xác thực)
const authenticateToken = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify-token`, {
      headers: { Authorization: token },
    });

    req.user = response.data; // Lưu thông tin user đã xác thực
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// Kiểm tra số điện thoại hoặc email trước khi đăng ký
app.post("/auth/check-user", async (req, res) => {
  try {
    console.log("🔹 Forwarding request to AUTH_SERVICE:", `${AUTH_SERVICE_URL}/check-user`); 
    const response = await axios.post(`${AUTH_SERVICE_URL}/check-user`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
});

// Đăng ký bằng số điện thoại + username + password
app.post("/auth/register/phone", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/register/phone`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
});

// Đăng ký / Đăng nhập bằng Google OAuth2
app.post("/auth/login/google", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login/google`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
});

// Đăng nhập bằng username/password
app.post("/auth/login", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
});

// Định tuyến cho Post Service (Tạo bài viết - CẦN token)
app.post("/posts", authenticateToken, async (req, res) => {
  try {
    console.log("🔹 Token received in API Gateway:", req.headers.authorization);

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

// Định tuyến cho Post Service (Xóa bài viết - CẦN token)
app.delete("/posts/:id", authenticateToken, async (req, res) => {
  try {
    const response = await axios.delete(`${POST_SERVICE_URL}/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
});

// Định tuyến cho User Service
app.get("/users/:id", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Cập nhật thông tin người dùng (CẦN token)
app.put("/users/:id", authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${USER_SERVICE_URL}/users/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Tạo người dùng mới (CÓ THỂ BỎ)
app.post("/users", async (req, res) => {
  try {
    console.log("🔹 Forwarding request to User Service:", `${USER_SERVICE_URL}/users`);

    const response = await axios.post(`${USER_SERVICE_URL}/users`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error forwarding to User Service:", error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// API kiểm tra hoạt động của Gateway
app.get("/", (req, res) => {
  res.send("🚀 API Gateway is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
});
