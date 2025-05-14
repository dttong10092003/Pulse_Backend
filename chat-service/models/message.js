const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['text', 'emoji', 'image', 'file', 'video', 'audio'], default: 'text' },
  content: { type: String, required: true },
  isDeleted: { type: Boolean, default: false }, 
  timestamp: { type: Date, default: Date.now },
  isPinned: { type: Boolean, default: false }, // Đánh dấu tin nhắn đã ghim
});

module.exports = mongoose.model('Message', MessageSchema);
