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
            return res.status(400).json({ message: 'Phone number or Email already in use' });
        }
        return res.status(200).json({ message: 'Available for registration' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


// const checkEmailOrPhoneExists = async (req, res) => {
//     try {
//       const { email, phoneNumber } = req.body;
  
//       if (!email && !phoneNumber) {
//         return res.status(400).json({ error: 'Missing email or phoneNumber' });
//       }
  
//       const conditions = [];
//       if (email) conditions.push({ email: email.trim() });
//       if (phoneNumber) conditions.push({ phoneNumber: phoneNumber.trim() });
  
//       const existingUser = await User.findOne({ $or: conditions });
  
//       if (!existingUser) {
//         return res.status(404).json({ message: 'Account not found' });
//       }
  
//       return res.status(200).json({ message: 'Account exists' });
//     } catch (err) {
//       return res.status(500).json({ message: err.message });
//     }
//   };
  
  
  



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

// Đăng ký / Đăng nhập bằng Google OAuth2
// const handleGoogleLogin = async (req, res) => {
//     try {
//         const { email, googleId } = req.body;

//         let user = await User.findOne({ email });

//         if (user) {
//             // Nếu user đã có tài khoản, đăng nhập luôn
//             const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//             return res.status(200).json({ token, user });
//         }

//         // Nếu user chưa có tài khoản, tạo mới
//         user = new User({ email, googleId, isVerified: false });
//         await user.save();

//         const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//         res.status(201).json({ token, user, message: "Please enter phone number to verify" });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };
const handleGoogleLogin = async (req, res) => {
  try {
    const { email, googleId } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      // Nếu user đã có tài khoản, kiểm tra `isVerified`
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.status(200).json({ token, user, isVerified: user.isVerified });
    }

    // Nếu user chưa có tài khoản, tạo mới
    user = new User({ email, googleId, isVerified: false });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user, isVerified: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

        res.json({ token });
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


  
// const sendResetPasswordToEmail = async (req, res) => {
//     try {
//       const { email } = req.body;
  
//       if (!email || !/.+@.+\..+/.test(email)) {
//         return res.status(400).json({ message: "Invalid email format" });
//       }
  
//       // Kiểm tra trong model User của auth-service
//       let user = await User.findOne({ email });
  
//       // Nếu không tìm thấy trong auth-service, gọi API của user-service để kiểm tra trong UserDetail
//       if (!user) {
//         const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5002';
  
//         try {
//           const response = await axios.post(`${userServiceUrl}/users/check-email-phone`, { email });
  
//           if (!response.data.exists) {
//             return res.status(404).json({ message: "Email not found" });
//           }
  
//           // Nếu tìm thấy trong user-service, ta có thể xử lý việc tạo mật khẩu trong auth-service
//           // Tạo user giả (bạn có thể cập nhật thêm trong auth-service nếu cần)
//           user = { email }; // Hoặc cập nhật thêm thông tin từ user-service
//         } catch (err) {
//           console.error("Error calling user-service:", err);
//           return res.status(404).json({ message: "User not found in user-service" });
//         }
//       }
  
//       // Tạo mật khẩu ngẫu nhiên
//       const randomPassword = Math.random().toString(36).slice(-6);
//       const hashedPassword = await bcrypt.hash(randomPassword, 10);
  
//       // Kiểm tra lại user tồn tại và cập nhật mật khẩu trong auth-service
//       if (user) {
//         user.password = hashedPassword;  // Cập nhật mật khẩu trong auth-service
//         await User.updateOne({ email }, { password: hashedPassword });  // Cập nhật vào cơ sở dữ liệu
//       }
  
//       // Gửi email với mật khẩu ngẫu nhiên
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: "tinphan309z@gmail.com",
//           pass: "plxbmhiqvijtliqn",
//         },
//       });
  
//       await transporter.sendMail({
//         from: '"PULSE Support" <tinphan309z@gmail.com>',
//         to: email,
//         subject: "🔐 Your New PULSE Password",
//         html: `
//           <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//             <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
//               <h2 style="color: #007BFF; text-align: center;">🔐 Your New PULSE Password</h2>
//               <p>Dear User,</p>
//               <p>We have generated a new password for your PULSE account. Please use the password below to log in:</p>
//               <div style="text-align: center; margin: 20px 0;">
//                 <span style="font-size: 18px; font-weight: bold; padding: 10px 15px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; display: inline-block; color: #333;">
//                   ${randomPassword}
//                 </span>
//               </div>
//               <p>For security reasons, we recommend changing your password after logging in.</p>
//               <p>If you did not request this password reset, please contact our support team immediately.</p>
//               <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
//               <p style="font-size: 12px; color: #666;">This email was sent by PULSE Support. If you have any questions, please contact us at <a href="mailto:support@pulse.com" style="color: #007BFF;">support@pulse.com</a>.</p>
//             </div>
//           </div>
//         `,
//       });
  
//       res.status(200).json({ message: "New password sent to your email" });
//     } catch (err) {
//       console.error("Send email error:", err);
//       return res.status(500).json({ message: "Failed to send reset email" });
//     }
//   };


// const sendResetPasswordToEmail = async (req, res) => {
//     try {
//       const { email } = req.body;
  
//       if (!email || !/.+@.+\..+/.test(email)) {
//         return res.status(400).json({ message: "Invalid email format" });
//       }
  
//       let user = await User.findOne({ email });
  
//       // Nếu không tìm thấy user trong auth-service, gọi API của user-service để kiểm tra
//       if (!user) {
//         const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5002';
  
//         try {
//           // Gọi API của user-service để kiểm tra email trong UserDetail
//           const response = await axios.post(`${userServiceUrl}/users/check-email-phone`, { email });
  
//           // Kiểm tra cấu trúc phản hồi từ user-service
//           console.log("User found in user-service:", response.data);
  
//           if (!response.data.exists) {
//             return res.status(404).json({ message: "Email not found" });
//           }
  
//           // Lấy userId từ phản hồi của user-service
//           const userId = response.data.userId; // Kiểm tra xem `userId` có trong response không
  
//           if (!userId) {
//             return res.status(404).json({ message: "User ID not found in user-service" });
//           }
  
//           // Nếu tìm thấy, ta sẽ sử dụng userId để cập nhật mật khẩu trong auth-service
//           user = { _id: userId, email }; // Tạo user giả có ID từ user-service
//         } catch (err) {
//           console.error("Error calling user-service:", err);
//           return res.status(404).json({ message: "User not found in user-service" });
//         }
//       }
  
//       // Tạo mật khẩu ngẫu nhiên
//       const randomPassword = Math.random().toString(36).slice(-6);
//       const hashedPassword = await bcrypt.hash(randomPassword, 10);
  
//       // Kiểm tra lại user tồn tại và cập nhật mật khẩu trong auth-service
//       if (user && user._id) {
//         // Cập nhật mật khẩu vào user trong auth-service bằng userId
//         const updatedUser = await User.findOneAndUpdate(
//           { _id: user._id },  // Cập nhật user dựa trên _id từ user-service
//           { password: hashedPassword }, // Cập nhật mật khẩu mới
//           { new: true }  // Trả về tài liệu đã được cập nhật
//         );
  
//         if (!updatedUser) {
//           return res.status(500).json({ message: "Failed to update password" });
//         }
//       }
  
//       // Gửi email với mật khẩu ngẫu nhiên
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: "tinphan309z@gmail.com",
//           pass: "plxbmhiqvijtliqn",
//         },
//       });
  
//       await transporter.sendMail({
//         from: '"PULSE Support" <tinphan309z@gmail.com>',
//         to: email,
//         subject: "🔐 Your New PULSE Password",
//         html: `
//           <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//             <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
//               <h2 style="color: #007BFF; text-align: center;">🔐 Your New PULSE Password</h2>
//               <p>Dear User,</p>
//               <p>We have generated a new password for your PULSE account. Please use the password below to log in:</p>
//               <div style="text-align: center; margin: 20px 0;">
//                 <span style="font-size: 18px; font-weight: bold; padding: 10px 15px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; display: inline-block; color: #333;">
//                   ${randomPassword}
//                 </span>
//               </div>
//               <p>For security reasons, we recommend changing your password after logging in.</p>
//               <p>If you did not request this password reset, please contact our support team immediately.</p>
//               <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
//               <p style="font-size: 12px; color: #666;">This email was sent by PULSE Support. If you have any questions, please contact us at <a href="mailto:support@pulse.com" style="color: #007BFF;">support@pulse.com</a>.</p>
//             </div>
//           </div>
//         `,
//       });
  
//       res.status(200).json({ message: "New password sent to your email" });
//     } catch (err) {
//       console.error("Send email error:", err);
//       return res.status(500).json({ message: "Failed to send reset email" });
//     }
//   };
  
  
const sendResetPasswordToEmail = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email || !/.+@.+\..+/.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
  
      let user = await User.findOne({ email });
  
      if (!user) {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:5002';
  
        try {
          // Gọi API checkEmailOrPhoneExists để kiểm tra sự tồn tại của email
          const response = await axios.post(`${userServiceUrl}/users/check-email-phone`, { email });
  
          if (!response.data.exists) {
            return res.status(404).json({ message: "Email not found" });
          }
  
          // Sau khi email đã tồn tại, gọi API user-details/{email} để lấy thông tin userId
          const userDetailResponse = await axios.get(`${userServiceUrl}/users/user-details/${email}`);
  
          if (!userDetailResponse.data.userId) {
            return res.status(404).json({ message: "UserId not found in user-service" });
          }
  
          const userId = userDetailResponse.data.userId;
  
          // Tạo user giả từ email đã tồn tại và userId từ user-service
          user = { email, _id: userId };
        } catch (err) {
          console.error("Error calling user-service:", err);
          return res.status(404).json({ message: "User not found in user-service" });
        }
      }
  
      // Tạo mật khẩu ngẫu nhiên
      const randomPassword = Math.random().toString(36).slice(-6);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
  
      // Cập nhật mật khẩu trong auth-service bằng userId
      if (user && user._id) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { password: hashedPassword },
          { new: true }
        );
  
        if (!updatedUser) {
          return res.status(500).json({ message: "Failed to update password" });
        }
      }
  
      // Gửi email với mật khẩu ngẫu nhiên
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "tinphan309z@gmail.com",
          pass: "plxbmhiqvijtliqn",
        },
      });
  
      await transporter.sendMail({
        from: '"PULSE Support" <tinphan309z@gmail.com>',
        to: email,
        subject: "🔐 Your New PULSE Password",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #007BFF; text-align: center;">🔐 Your New PULSE Password</h2>
              <p>Dear User,</p>
              <p>We have generated a new password for your PULSE account. Please use the password below to log in:</p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 18px; font-weight: bold; padding: 10px 15px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; display: inline-block; color: #333;">
                  ${randomPassword}
                </span>
              </div>
              <p>For security reasons, we recommend changing your password after logging in.</p>
              <p>If you did not request this password reset, please contact our support team immediately.</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">This email was sent by PULSE Support. If you have any questions, please contact us at <a href="mailto:support@pulse.com" style="color: #007BFF;">support@pulse.com</a>.</p>
            </div>
          </div>
        `,
      });
  
      res.status(200).json({ message: "New password sent to your email" });
    } catch (err) {
      console.error("Send email error:", err);
      return res.status(500).json({ message: "Failed to send reset email" });
    }
  };
  





module.exports = {
    checkUserExists,
    registerUserWithPhone,
    handleGoogleLogin,
    loginUser,
    authenticateToken,
    checkEmailOrPhoneExists,
    sendResetPasswordToEmail
};
