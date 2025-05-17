const express = require('express');
const { transcribeAudio } = require('../controllers/transcriptionController');
const router = express.Router();

router.post('/transcribe', transcribeAudio);

module.exports = router;
