const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['text', 'emoji', 'image', 'file'], default: 'text' },
  content: { type: String, required: true },
  isDeleted: { type: Boolean, default: false }, 
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);
