const express = require("express");
const {
  uploadVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  getSubtitles,} = require("../controllers/videoController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadVideoMiddleware = require("../middleware/uploadVideo");
const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  uploadVideoMiddleware.single("video"),
  uploadVideo
);
router.get("/", authMiddleware, getVideos);
router.get("/:id", authMiddleware, getVideoById);
router.delete("/:id", authMiddleware, deleteVideo);
router.get("/:id/subtitles", authMiddleware, getSubtitles);

module.exports = router;