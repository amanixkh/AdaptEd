const express = require("express");
const router = express.Router();
const { shareLesson, getSharedStudents } = require("../controllers/shareController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/lessons/:id/share", authMiddleware, shareLesson);
router.get("/lessons/:id/shared-students", authMiddleware, getSharedStudents);

module.exports = router;