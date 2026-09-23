const express = require("express");
const { getHistory } = require("../controllers/historyController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", authMiddleware, getHistory);
module.exports = router;