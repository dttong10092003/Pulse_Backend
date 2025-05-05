const DeletedConversation = require('../models/deletedConversation');

exports.updateUnreadCount = async (req, res) => {
  try {
    const { userId, conversationId, unreadCount } = req.body;

    const updated = await DeletedConversation.findOneAndUpdate(
      { userId, conversationId },
      { $set: { unreadCount } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Unread count updated', data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /deleted-conversations/unread-count/increment
exports.incrementUnreadCount = async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    const updated = await DeletedConversation.findOneAndUpdate(
      { userId, conversationId },
      { $inc: { unreadCount: 1 } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Unread count incremented', data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// PATCH /deleted-conversations/deleted-at
exports.updateDeletedAt = async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    const updated = await DeletedConversation.findOneAndUpdate(
      { userId, conversationId },
      { $set: { deletedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'deletedAt updated', data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

  
  exports.getDeletedConversations = async (req, res) => {
    try {
      const { userId } = req.params;
      const list = await DeletedConversation.find({ userId });
      res.status(200).json(list);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

