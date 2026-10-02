const express = require("express");
const {
  getAdminStats,
  getAdminUsers,
  getAdminLessons,
  deleteLesson,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const router = express.Router();
router.use(authMiddleware); 
router.use(adminMiddleware);
router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.get("/lessons", getAdminLessons);
router.delete("/lessons/:id", deleteLesson);
module.exports = router;