const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

const authenticateToken = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/verify-token`, {
      headers: { Authorization: token },
    });

    req.user = response.data;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = { authenticateToken };
