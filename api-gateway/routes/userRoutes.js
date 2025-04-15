const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/top10-users", userService.getTop10Users); // Lấy danh sách 10 người dùng
router.get("/:id", authenticateToken, userService.getUser);
router.put("/:id", authenticateToken, userService.updateUser);
router.post("/", authenticateToken, userService.createUserDetail);
router.post("/check-email-phone", userService.checkEmailOrPhoneExists);
router.get("/user-details/:email", userService.getUserByEmail);
router.post('/user-details-by-ids', authenticateToken, userService.getUserDetailsByIds);


module.exports = router;
