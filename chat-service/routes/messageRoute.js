const express = require('express');
const { sendMessage, getMessages, getRecentImages, getRecentFiles, pinMessage, unpinMessage, getPinnedMessages, revokeMessage, deleteMessage ,getUnreadCount} = require('../controllers/messageController');

const router = express.Router();
router.get('/:conversationId', getMessages);
router.post('/send', sendMessage);
router.get('/images/:conversationId', getRecentImages);
router.get('/files/:conversationId', getRecentFiles);
router.post('/pin', pinMessage);
router.post('/unpin', unpinMessage);
router.get('/pinned/:conversationId', getPinnedMessages);
router.post('/revoke', revokeMessage);
router.post('/delete', deleteMessage);
router.get('/unread/:userId', getUnreadCount);

module.exports = router;
