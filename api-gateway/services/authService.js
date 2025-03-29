const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

const checkUser = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/check-user`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const registerWithPhone = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/register/phone`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login/google`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const loginWithUsername = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};


const checkEmailOrPhone = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/check-email-phone`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const sendResetPasswordToEmail = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/send-reset-email`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const resetPasswordWithToken = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/reset-password`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const resetPasswordWithPhone = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/reset-password-phone`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

module.exports = { checkUser, registerWithPhone, loginWithGoogle, loginWithUsername, checkEmailOrPhone, sendResetPasswordToEmail, resetPasswordWithToken, resetPasswordWithPhone };
