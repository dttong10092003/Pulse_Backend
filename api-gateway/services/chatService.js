const axios = require("axios");

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL;

const getAllConversations = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/conversations/all/${req.params.userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣ Kiểm tra trạng thái online của user
const checkUserOnline = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/conversations/online/${req.params.userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 2️⃣ Tạo hoặc lấy cuộc trò chuyện riêng tư
const createOrGetPrivateConversation = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/conversations/private`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 3️⃣ Tạo nhóm chat
const createGroupConversation = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/conversations/group`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 4️⃣ Thêm thành viên vào nhóm
const addMemberToGroup = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/conversations/group/addMember`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 5️⃣ Xóa thành viên khỏi nhóm
const removeMemberFromGroup = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/conversations/group/removeMember`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 6️⃣ Chuyển trưởng nhóm
const changeGroupAdmin = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/conversations/group/changeAdmin`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 7️⃣ Lấy danh sách cuộc trò chuyện gần đây
const getRecentConversations = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/conversations/recent/${req.params.userId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.log("Hello:::::",error);
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 8️⃣ Tìm kiếm cuộc trò chuyện theo tên nhóm hoặc tên người còn lại
const searchConversations = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/conversations/search`, { params: req.query });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 9️⃣ Gửi tin nhắn
const sendMessage = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/messages/send`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 🔟 Lấy tin nhắn của cuộc trò chuyện
const getMessages = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/messages/${req.params.conversationId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣1️⃣ Lấy 5 tin nhắn gần nhất là hình ảnh
const getRecentImages = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/messages/images/${req.params.conversationId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣2️⃣ Lấy 5 tin nhắn gần nhất là file
const getRecentFiles = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/messages/files/${req.params.conversationId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣3️⃣ Ghim tối đa 2 tin nhắn
const pinMessage = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/messages/pin`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣4️⃣ Lấy tin nhắn đã ghim
const getPinnedMessages = async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_SERVICE_URL}/messages/pinned/${req.params.conversationId}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣5️⃣ Thu hồi tin nhắn
const revokeMessage = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/messages/revoke`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

// 1️⃣6️⃣ Bỏ ghim tin nhắn
const unpinMessage = async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_SERVICE_URL}/messages/unpin`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

const updateGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params; // Lấy ID cuộc trò chuyện cần cập nhật
    const { groupName, avatar } = req.body; // Các thông tin cần cập nhật

    const response = await axios.put(`${CHAT_SERVICE_URL}/conversations/group/update/${conversationId}`, { groupName, avatar });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.response?.data?.message || error.message });
  }
};

module.exports = {
  updateGroupConversation,
  getAllConversations,
  checkUserOnline,
  createOrGetPrivateConversation,
  createGroupConversation,
  addMemberToGroup,
  removeMemberFromGroup,
  changeGroupAdmin,
  getRecentConversations,
  searchConversations,
  sendMessage,
  getMessages,
  getRecentImages,
  getRecentFiles,
  pinMessage,
  getPinnedMessages,
  revokeMessage,
  unpinMessage,
};
