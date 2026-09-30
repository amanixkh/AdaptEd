const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createLiveClass,
  getUpcomingLiveClasses,
  getMyLiveClasses,
  deleteLiveClass,
} = require("../controllers/liveClassController");

const router = express.Router();

router.post("/", authMiddleware, createLiveClass);
router.get("/upcoming", authMiddleware, getUpcomingLiveClasses);
router.get("/mine", authMiddleware, getMyLiveClasses);
router.delete("/:id", authMiddleware, deleteLiveClass);

module.exports = router;
