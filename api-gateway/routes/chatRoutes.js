const express = require('express');
const chatService = require('../services/chatService');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// 📌 Conversations
router.get('/conversations/all/:userId', authenticateToken, chatService.getAllConversations);
router.post('/conversations/private', authenticateToken, chatService.createOrGetPrivateConversation);
router.post('/conversations/private_app', chatService.createOrGetPrivateConversation_App);

router.post('/conversations/group', authenticateToken, chatService.createGroupConversation);
router.post('/conversations/group/addMember', authenticateToken, chatService.addMemberToGroup);
router.post('/conversations/group/removeMember', authenticateToken, chatService.removeMemberFromGroup);
router.post('/conversations/group/changeAdmin', authenticateToken, chatService.changeGroupAdmin);
router.get('/conversations/recent/:userId', authenticateToken, chatService.getRecentConversations);
router.get('/conversations/search', authenticateToken, chatService.searchConversations);

// 📌 User Online Status
router.get('/conversations/online/:userId', authenticateToken, chatService.checkUserOnline);

// 📌 Messages
router.post('/messages/send', authenticateToken, chatService.sendMessage);
router.get('/messages/:conversationId', authenticateToken, chatService.getMessages);
router.get('/messages/images/:conversationId', authenticateToken, chatService.getRecentImages);
router.get('/messages/files/:conversationId', authenticateToken, chatService.getRecentFiles);
router.post('/messages/pin', authenticateToken, chatService.pinMessage);
router.post('/messages/unpin', authenticateToken, chatService.unpinMessage);
router.get('/messages/pinned/:conversationId', authenticateToken, chatService.getPinnedMessages);
router.post('/messages/revoke', authenticateToken, chatService.revokeMessage);

router.put('/conversations/group/update/:conversationId', authenticateToken, chatService.updateGroupConversation); // Thêm route này
router.post('/messages/delete', authenticateToken, chatService.deleteMessage);
router.get('/messages/unread/:userId', authenticateToken, chatService.getUnreadCount);

// 📌 Deleted Conversations
router.patch('/deleted-conversations/unread-count', authenticateToken, chatService.updateUnreadCount);
router.patch('/deleted-conversations/deleted-at', authenticateToken, chatService.updateDeletedAt);
router.get('/deleted-conversations/:userId', authenticateToken, chatService.getDeletedConversations);
router.patch('/deleted-conversations/unread-count/increment', authenticateToken, chatService.incrementUnreadCount);


router.post('/voice-to-text', authenticateToken, chatService.transcribeVoice);




module.exports = router;
