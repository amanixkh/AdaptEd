const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createLiveClass, getUpcomingLiveClasses } = require("../controllers/liveClassController");

const router = express.Router();

router.post("/", authMiddleware, createLiveClass);
router.get("/upcoming", authMiddleware, getUpcomingLiveClasses);

module.exports = router;
