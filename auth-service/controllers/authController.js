// auth-service/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const axios = require("axios");

// Kiểm tra số điện thoại hoặc email đã tồn tại chưa
const checkUserExists = async (req, res) => {
  try {
    const { phoneNumber, username } = req.body;
    const existingUser = await User.findOne({ $or: [{ phoneNumber }, { username }] });

    if (existingUser) {
      return res.status(400).json({ message: 'Phone number or Username already in use' });
    }
    return res.status(200).json({ message: 'Available for registration' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Đăng ký bằng số điện thoại + username + password
const registerUserWithPhone = async (req, res) => {
  try {
    const { phoneNumber, username, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ phoneNumber }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number or Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ phoneNumber, username, password: hashedPassword, isVerified: true });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// const handleGoogleLogin = async (req, res) => {
//   try {
//     const { email, googleId } = req.body;

//     let user = await User.findOne({ email });

//     if (user) {
//       const isVerified = !!(user.firstname && user.lastname); // chỉ cần 2 field là đủ xác minh
//       const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       return res.status(200).json({ token, user, isVerified });
//     }
    

//     // Nếu chưa tồn tại thì tạo mới user
//     user = new User({
//       email,
//       googleId,
//       username: email.split("@")[0],
//       isVerified: false
//     });

//     await user.save();

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.status(201).json({ token, user, isVerified: false });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// const handleGoogleLogin = async (req, res) => {
//   try {
//     const { email, googleId } = req.body;

//     let user = await User.findOne({ email });

//     if (user) {
//       // ✅ Kiểm tra đã điền đầy đủ thông tin chưa
//       const isVerified = !!(user.firstname && user.lastname); // có thể thêm dob, gender nếu cần
//       const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       return res.status(200).json({ token, user, isVerified });
//     }

//     // ✅ Nếu user chưa tồn tại → tạo mới user với username mặc định
//     user = new User({
//       email,
//       googleId,
//       username: email.split("@")[0],
//       isVerified: false
//     });

//     await user.save();

//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     // ✅ isVerified là false vì user mới tạo
//     res.status(201).json({ token, user, isVerified: false });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
const handleGoogleLogin = async (req, res) => {
  try {
    const { email, googleId } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // Nếu chưa tồn tại thì tạo mới user
      user = new User({
        email,
        googleId,
        username: email.split("@")[0],
        isVerified: false
      });
      await user.save();
    }

    // ✅ Gọi API sang user-service để kiểm tra có userDetail chưa
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:5002";
    
    let hasUserDetail = false;
    try {
      const detailRes = await axios.get(`${userServiceUrl}/users/${user._id}`);
      hasUserDetail = !!(detailRes.data?.firstname && detailRes.data?.lastname);
    } catch (err) {
      console.warn("Không tìm thấy userDetail hoặc user-service lỗi:", err.message);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user,
      isVerified: hasUserDetail
    });

  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Đăng nhập bằng username/password
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

const checkEmailOrPhoneExists = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Missing email or phoneNumber' });
    }

    // Điều kiện tìm kiếm cho email và phoneNumber
    const conditions = [];
    if (email) conditions.push({ email: email.trim() });
    if (phoneNumber) conditions.push({ phoneNumber: phoneNumber.trim() });

    // Kiểm tra trong model User của auth-service
    const existingUser = await User.findOne({ $or: conditions });

    if (existingUser) {
      return res.status(200).json({ message: 'Account exists in User' });
    }

    // Nếu không tìm thấy trong User, gọi API của user-service để kiểm tra UserDetail
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5002'; // Đảm bảo rằng USER_SERVICE_URL đã được cấu hình đúng trong docker-compose.yml

    // Gửi yêu cầu tới API của user-service
    const response = await axios.post(`${userServiceUrl}/users/check-email-phone`, { email, phoneNumber });

    // Kiểm tra kết quả từ user-service
    if (response.data.exists) {
      return res.status(200).json({ message: 'Account exists in UserDetail' });
    }

    // Nếu không tìm thấy tài khoản nào
    return res.status(404).json({ message: 'Account not found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
const sendResetPasswordToEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5002';
      try {
        const response = await axios.post(`${userServiceUrl}/users/check-email-phone`, { email });
        if (!response.data.exists) {
          return res.status(404).json({ message: 'Email not found' });
        }
        const userDetailResponse = await axios.get(`${userServiceUrl}/users/user-details/${email}`);
        if (!userDetailResponse.data.userId) {
          return res.status(404).json({ message: 'UserId not found in user-service' });
        }
        const userId = userDetailResponse.data.userId;
        user = { email, _id: userId }; // Tạo đối tượng user giả từ email và userId
      } catch (err) {
        console.error('Error calling user-service:', err);
        return res.status(404).json({ message: 'User not found in user-service' });
      }
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "tinphan309z@gmail.com",
        pass: "plxbmhiqvijtliqn",
      },
    });

    await transporter.sendMail({
      from: '"PULSE Support" <tinphan309z@gmail.com>',
      to: email,
      subject: '🔐 Reset your PULSE Password',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #007BFF; text-align: center;">🔐 Reset your PULSE Password</h2>
            <p>Dear User,</p>
            <p>We received a request to reset your password for your PULSE account.</p>
            <p>Click the link below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetLink}" style="font-size: 18px; font-weight: bold; padding: 10px 15px; background: #007BFF; color: white; text-decoration: none; border-radius: 4px;">
                Reset Password
              </a>
            </div>
            <p>If you did not request this, please ignore this email.</p>
            <p>For security reasons, the link will expire in 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">This email was sent by PULSE Support. If you have any questions, please contact us at <a href="mailto:support@pulse.com" style="color: #007BFF;">support@pulse.com</a>.</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ message: 'Reset password link sent to your email' });

  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ message: 'Failed to send reset email' });
  }
};

const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Xác minh token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = payload.userId;

    // Băm mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu trong database
    const updatedUser = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};
const resetPasswordWithPhone = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    const user = await User.findOne({ phoneNumber: phoneNumber.trim() });

    if (!user) {
      return res.status(404).json({ message: 'User with this phone number not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully via phone' });
  } catch (err) {
    console.error("Reset by phone error:", err);
    res.status(500).json({ message: 'Server error while resetting password via phone' });
  }
};
// Lấy username theo userId
const getUsernameById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ username: user.username });
  } catch (err) {
    console.error("Get username error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
const getMe = async (req, res) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  const token = authHeader.startsWith('Bearer ')
  ? authHeader.replace('Bearer ', '')
  : authHeader;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Gọi user-service để lấy thông tin chi tiết
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:5002";
    const detailRes = await axios.get(`${userServiceUrl}/users/${user._id}`);

    const userDetail = detailRes.data;
    userDetail.username = user.username;


    res.status(200).json({ user, userDetail });
  } catch (err) {
    console.error("getMe error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
const otpStore = {}; // Dùng tạm bộ nhớ RAM, có thể thay bằng Redis

const sendEmailOtp = async (req, res) => {
  const { email } = req.body;

  // Validate định dạng email
  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    // Kiểm tra email đã tồn tại trong bảng User của auth-service chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists in User" });
    }

    // 🔁 Gọi API sang user-service để kiểm tra email trong UserDetail
    const userServiceUrl = process.env.USER_SERVICE_URL || "http://user-service:5002";
    const response = await axios.post(`${userServiceUrl}/users/check-email-phone`, { email });

    if (response.data.exists) {
      return res.status(400).json({ message: "Email already exists in UserDetail" });
    }

    // Tạo mã OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otpCode;

    // Gửi OTP qua email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "tinphan309z@gmail.com",
        pass: "plxbmhiqvijtliqn",
      },
    });

    await transporter.sendMail({
      from: '"PULSE OTP" <tinphan309z@gmail.com>',
      to: email,
      subject: "🔐 Your PULSE Email Verification Code",
      html: `
        <div style="font-family: 'Arial', sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background-color: #4CAF50; padding: 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">PULSE</h1>
              <p style="margin: 0; font-size: 16px;">Secure Email Verification</p>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #333; font-size: 22px;">Your OTP Code: <span style="color: #4CAF50;">${otpCode}</span></h2>
              <p style="font-size: 16px; line-height: 1.5; margin-top: 20px;">Hi there,</p>
              <p style="font-size: 16px; line-height: 1.5;">Please use the 6-digit code above to verify your email address. This code is valid for the next <strong>5 minutes</strong>.</p>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you did not request this code, please ignore this email or contact support.</p>
            </div>
            <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 14px; color: #666;">
              <p style="margin: 0;">Need help? <a href="mailto:support@pulse.com" style="color: #4CAF50; text-decoration: none;">Contact Support</a></p>
            </div>
          </div>
        </div>
      `
    });

    res.status(200).json({ message: "OTP sent to email" });

  } catch (err) {
    console.error("sendEmailOtp error:", err.message);
    res.status(500).json({ message: "Failed to send OTP email" });
  }
};

const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  if (otpStore[email] === otp) {
    delete otpStore[email]; // Xác thực xong thì xóa
    return res.status(200).json({ message: "OTP verified successfully" });
  } else {
    return res.status(400).json({ message: "Invalid OTP" });
  }
};


module.exports = {
  checkUserExists,
  registerUserWithPhone,
  handleGoogleLogin,
  loginUser,
  authenticateToken,
  checkEmailOrPhoneExists,
  sendResetPasswordToEmail,
  resetPasswordWithToken,
  resetPasswordWithPhone,
  getMe,
  getUsernameById,
  sendEmailOtp,
  verifyEmailOtp,
};
