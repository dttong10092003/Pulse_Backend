const express = require('express');
const { createOrGetPrivateConversation, createGroupConversation, addMemberToGroup, getRecentConversations, checkUserOnline } = require('../controllers/conversationController');

const router = express.Router();

router.post('/private', createOrGetPrivateConversation);
router.post('/group', createGroupConversation);
router.post('/group/addMember', addMemberToGroup);
router.get('/recent/:userId', getRecentConversations);
router.get('/online/:userId', checkUserOnline);

module.exports = router;
