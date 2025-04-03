const express = require('express');
const {
  createOrGetPrivateConversation,
  createGroupConversation,
  addMemberToGroup,
  removeMemberFromGroup,
  changeGroupAdmin,
  getRecentConversations,
  checkUserOnline,
  searchConversations,
  getAllConversations,
  updateGroupConversation,
} = require('../controllers/conversationController');

const router = express.Router();

// 📌 Tạo hoặc lấy cuộc trò chuyện riêng tư (có tên hiển thị)
router.post('/private', createOrGetPrivateConversation);

router.get('/all/:userId', getAllConversations);
// 📌 Tạo nhóm chat
router.post('/group', createGroupConversation);

// 📌 Quản lý thành viên nhóm
router.post('/group/addMember', addMemberToGroup);
router.post('/group/removeMember', removeMemberFromGroup);

// 📌 Quản lý trưởng nhóm
router.post('/group/changeAdmin', changeGroupAdmin);

// 📌 Lấy danh sách cuộc trò chuyện gần đây của user
router.get('/recent/:userId', getRecentConversations);

// 📌 Kiểm tra trạng thái online của user
router.get('/online/:userId', checkUserOnline);

// 📌 Tìm kiếm cuộc trò chuyện theo tên nhóm hoặc tên người còn lại
router.get('/search', searchConversations);

// 📌 Cập nhật thông tin nhóm trò chuyện (Đổi tên nhóm, avatar, ...)
router.put('/group/update/:conversationId', updateGroupConversation)

module.exports = router;
