const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true, // Cho phép bỏ trống (không bắt buộc với Google OAuth2)
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Cho phép bỏ trống nếu user đăng ký bằng số điện thoại
        match: /.+\@.+\..+/,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: { 
        type: String, 
    },
    googleId: { 
        type: String, 
        unique: true,
        sparse: true, // Chỉ dùng cho user đăng ký qua Google OAuth2
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
