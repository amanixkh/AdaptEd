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

router.post("/upload", authMiddleware, (req, res, next) => {
  uploadVideoMiddleware.single("video")(req, res, (error) => {
    if (error) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      const invalidType = error.code === "INVALID_FILE_TYPE";
      const status = tooLarge ? 413 : invalidType ? 400 : 500;
      const errorCode = tooLarge ? "VIDEO_TOO_LARGE" : invalidType ? "VIDEO_INVALID_TYPE" : "VIDEO_UPLOAD_FAILED";
      const message = tooLarge
        ? "The maximum video size is 200 MB."
        : invalidType
          ? "Please choose an MP4, WebM, or MOV file."
          : "Could not upload this video.";
      return res.status(status).json({ success: false, errorCode, message });
    }

    return uploadVideo(req, res, next);
  });
});
router.get("/", authMiddleware, getVideos);
router.get("/:id", authMiddleware, getVideoById);
router.delete("/:id", authMiddleware, deleteVideo);
router.get("/:id/subtitles", authMiddleware, getSubtitles);

module.exports = router;