const fs = require("fs");
const pool = require("../config/db");

async function uploadVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video file uploaded" });
    }

    const { lessonId, title } = req.body || {};
    const userId = req.user.id;

    if (lessonId) {
      const lessonCheck = await pool.query(
        "SELECT id FROM lessons WHERE id = $1 AND user_id = $2",
        [lessonId, userId]
      );
      if (lessonCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this lesson",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO videos (user_id, lesson_id, title, video_path)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, lessonId || null, title || req.file.originalname, req.file.path]
    );

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: result.rows[0],
    });
  } catch (error) {
    console.error("Upload video error:", error);
    return res.status(500).json({ success: false, message: "Failed to upload video" });
  }
}

async function getVideos(req, res) {
  try {
    const { lessonId } = req.query;
    let query = `SELECT id, lesson_id, title, video_path, duration, created_at
                 FROM videos WHERE user_id = $1`;
    const params = [req.user.id];

    if (lessonId) {
      query += " AND lesson_id = $2";
      params.push(lessonId);
    }
    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, videos: result.rows });
  } catch (error) {
    console.error("Get videos error:", error);
    return res.status(500).json({ success: false, message: "Failed to get videos" });
  }
}

async function getVideoById(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, lesson_id, title, video_path, duration, created_at
       FROM videos WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    return res.status(200).json({ success: true, video: result.rows[0] });
  } catch (error) {
    console.error("Get video error:", error);
    return res.status(500).json({ success: false, message: "Failed to get video" });
  }
}

async function deleteVideo(req, res) {
  try {
    const result = await pool.query(
      "SELECT video_path FROM videos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const videoPath = result.rows[0].video_path;
    await pool.query("DELETE FROM videos WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.id,
    ]);
    if (videoPath && fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    return res.status(200).json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete video" });
  }
}

async function getSubtitles(req, res) {
  try {
    const result = await pool.query(
      `SELECT subtitle_ar_path, subtitle_en_path, subtitle_ku_path
       FROM videos WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const video = result.rows[0];
    return res.status(200).json({
      success: true,
      subtitles: {
        ar: video.subtitle_ar_path,
        en: video.subtitle_en_path,
        ku: video.subtitle_ku_path,
      },
    });
  } catch (error) {
    console.error("Get subtitles error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subtitles" });
  }
}

module.exports = { uploadVideo, getVideos, getVideoById, deleteVideo, getSubtitles };
