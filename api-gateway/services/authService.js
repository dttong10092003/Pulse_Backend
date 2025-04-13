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

const loginWithGoogleRegister = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/register/google`, req.body);
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

const getMe = async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/me`, { headers: { Authorization: req.headers.authorization } });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}
const getUsernameById = async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/username/${req.params.id}`, { headers: { Authorization: req.headers.authorization } });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}
const sendEmailOtp = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/send-email-otp`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}
const verifyEmailOtp = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/verify-email-otp`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const loginGoogle = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login/google`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}
const changePassword = async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/change-password`, req.body, { headers: { Authorization: req.headers.authorization } });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const getPhoneNumber = async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/phone`, { headers: { Authorization: req.headers.authorization } });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
}

const getBatchUsernames = async (req, res) => {
  try {
    const { userIds } = req.body; // Nhận danh sách userIds từ request body

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    // Gửi request tới auth-service để lấy usernames
    const response = await axios.post(`${AUTH_SERVICE_URL}/auth/batch-usernames`, { userIds }, {
      headers: { Authorization: req.headers.authorization }
    });

    // Trả kết quả từ auth-service về cho client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Error in API Gateway getBatchUsernames:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message
    });
  }
};

module.exports = { checkUser, registerWithPhone, loginWithGoogleRegister, loginWithUsername, 
  checkEmailOrPhone, sendResetPasswordToEmail, 
  resetPasswordWithToken, resetPasswordWithPhone, getMe, getUsernameById, sendEmailOtp, verifyEmailOtp, loginGoogle, changePassword,getBatchUsernames,getPhoneNumber };
