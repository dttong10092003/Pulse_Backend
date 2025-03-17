const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messageController');

const router = express.Router();

router.get('/:conversationId', getMessages);
router.post('/send', sendMessage);

module.exports = router;
