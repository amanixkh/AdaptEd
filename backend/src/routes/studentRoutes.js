const express = require("express");
const {
  getSharedLessons,
  getSharedLessonById,
  getQuizAttempts,
  submitQuizAttempt,
} = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/lessons", authMiddleware, getSharedLessons);
router.get("/lessons/:id", authMiddleware, getSharedLessonById);
router.get("/lessons/:id/quiz-attempts", authMiddleware, getQuizAttempts);
router.post("/lessons/:id/quiz-attempts", authMiddleware, submitQuizAttempt);

module.exports = router;
