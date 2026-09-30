const express = require("express");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

router.get("/:id/file", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.file_path, l.original_name
         FROM lessons l
        WHERE l.id = $1
          AND (l.user_id = $2
               OR EXISTS (SELECT 1 FROM lesson_assignments la
                           WHERE la.lesson_id = l.id AND la.student_id = $2))`,
      [id, req.user.id]
    );
    const row = result.rows[0];
    if (!row || !row.file_path) return res.status(404).json({ message: "File not found" });

    const filePath = path.resolve(row.file_path);
    if (!filePath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    const name = String(row.original_name || "lesson.pdf").replace(/["\r\n]/g, "");
    const TYPES = { ".pdf": "application/pdf", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".m4v": "video/x-m4v" };
    res.setHeader("Content-Type", TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
