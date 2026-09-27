const express = require("express");
const jwt = require("jsonwebtoken");
const {
  sendMessage,
  getChatHistory,
  deleteChatHistory,
} = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    req.user = undefined;
  }

  next();
}

router.post("/", optionalAuth, sendMessage);
router.get("/history/:lessonId", authMiddleware, getChatHistory);
router.delete("/history/:lessonId", authMiddleware, deleteChatHistory);

module.exports = router;
