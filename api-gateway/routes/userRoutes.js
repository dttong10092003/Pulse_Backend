const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/:id", authenticateToken, userService.getUser);
router.put("/:id", authenticateToken, userService.updateUser);
router.post("/", authenticateToken, userService.createUserDetail);

module.exports = router;
