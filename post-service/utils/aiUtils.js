const axios = require("axios");

const checkToxicWithAI = async (text, retryCount = 0) => {
  const MAX_RETRIES = 1;

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dynabench-r4-target",
      {
        inputs: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    const result = response.data[0]; // [{label: "...", score: ...}, ...]
    console.log("🎯 HuggingFace Raw:", result);

    // Dùng threshold nhạy hơn
    const toxicScore = result.find(r => r.label.toLowerCase() === "toxic")?.score || 0;
    const obsceneScore = result.find(r => r.label.toLowerCase() === "obscene")?.score || 0;
    const insultScore = result.find(r => r.label.toLowerCase() === "insult")?.score || 0;
    const hateScore = result.find(r => r.label.toLowerCase().includes("hate"))?.score || 0;

    const isToxic =
      toxicScore > 0.02 ||
      obsceneScore > 0.01 ||
      insultScore > 0.01 ||
      hateScore > 0.01;

    console.log("✅ Content is", isToxic ? "toxic 🚫" : "clean ✅");
    return isToxic;
  } catch (err) {
    const status = err.response?.status;
    const message = err.message || err.response?.data;

    if (status === 429 && retryCount < MAX_RETRIES) {
      const waitTime = 1000 * (retryCount + 1);
      console.warn(`⚠️ Rate limit hit. Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return checkToxicWithAI(text, retryCount + 1);
    }

    console.error("❌ HuggingFace AI error:", message);
    return false; // mặc định cho qua nếu lỗi
  }
};

module.exports = { checkToxicWithAI };
