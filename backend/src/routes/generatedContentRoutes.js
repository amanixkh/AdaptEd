const express = require("express");
const { updateGeneratedContent,deleteGeneratedContent,} = require("../controllers/generatedContentController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.put("/:id", authMiddleware, updateGeneratedContent);
router.delete("/:id", authMiddleware, deleteGeneratedContent);
module.exports = router;