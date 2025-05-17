const axios = require('axios');
const { parseBase64 } = require('../utils/parseBase64');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.transcribeAudio = async (req, res) => {
  try {
    const { audioUrl } = req.body;
    const fileName = 'voice-message.wav';

    if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Invalid or missing base64 audio URL' });
    }

    const { buffer } = parseBase64(audioUrl);

    const cloudinaryUrl = await uploadToCloudinary(buffer, fileName, 'voice_transcriptions');

    const response = await axios.post(
      'https://api.deepgram.com/v1/listen',
      {
        url: cloudinaryUrl,
        language: 'vi',
      },
      {
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    res.json({ transcript });
  } catch (error) {
    console.error('Deepgram error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
};
