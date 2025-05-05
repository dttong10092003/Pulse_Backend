const mongoose = require('mongoose');

const DeletedConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  deletedAt: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
}, { timestamps: true });

DeletedConversationSchema.index({ userId: 1, conversationId: 1 }, { unique: true });

module.exports = mongoose.model('DeletedConversation', DeletedConversationSchema);
