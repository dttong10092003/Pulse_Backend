const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  conversationId: { type: String, unique: true, required: true },
  members: { type: [String], required: true },
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
});

module.exports = mongoose.model('Conversation', ConversationSchema);
