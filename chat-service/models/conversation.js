const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  members: { type: [mongoose.Schema.Types.ObjectId], required: true },
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
  adminId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
