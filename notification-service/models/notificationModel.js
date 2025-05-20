
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ['message', 'like', 'comment', 'follow','report'] // ➕ thêm 'follow'
    },

    receiverId: { type: String, required: true },   // Người nhận thông báo
    senderId: { type: String, required: true },     // Người tạo thông báo

    // Message type
    messageContent: { type: String },
    chatId: { type: String },

    // Post related
    postId: { type: String },
    commentContent: { type: String },

    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;  