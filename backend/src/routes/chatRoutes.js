const express = require("express");
const {
  sendMessage,
  getChatHistory,
  deleteChatHistory,
} = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// The tutor reads a lesson's text and sends it to the AI provider, so the caller
// must be authenticated; chatController then verifies lesson access (owner or
// assigned student) before loading any content.
router.post("/", authMiddleware, sendMessage);
router.get("/history/:lessonId", authMiddleware, getChatHistory);
router.delete("/history/:lessonId", authMiddleware, deleteChatHistory);

module.exports = router;
