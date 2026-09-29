const express = require("express");
const router = express.Router();
const { addStudent, searchMyStudents, getMyStudents } = require("../controllers/teacherStudentController");
const authMiddleware = require("../middleware/authMiddleware");
router.post("/teacher/students/add", authMiddleware, addStudent);
router.get("/teacher/students/search", authMiddleware, searchMyStudents);
router.get("/teacher/students", authMiddleware, getMyStudents);

module.exports = router;