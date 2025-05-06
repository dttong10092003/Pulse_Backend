const express = require('express');
const router = express.Router();
const deletedController = require('../controllers/deletedConversationController');

router.patch('/unread-count', deletedController.updateUnreadCount);
router.patch('/deleted-at', deletedController.updateDeletedAt);
router.patch('/unread-count/increment', deletedController.incrementUnreadCount);
router.get('/:userId', deletedController.getDeletedConversations);

module.exports = router;