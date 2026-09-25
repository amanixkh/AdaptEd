const express = require("express");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const pool = require("../config/db");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const { extractTextWithOcr } = require("../services/ocrService");
const { computePercentage, isPassed } = require("../utils/quizScoring");

const router = express.Router();

function ensureTeacher(req, res) {
  if (req.user.role !== "teacher") {
    res.status(403).json({ success: false, message: "Teacher access only" });
    return false;
  }
  return true;
}

function cleanExtractedText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasUsableExtractedText(text) {
  const cleanedText = cleanExtractedText(text || "");
  if (cleanedText.replace(/\s/g, "").length < 20) return false;
  return !looksLikeMojibake(cleanedText);
}

// Detects UTF-8 text that was mis-decoded as latin1/windows-1252 (e.g. Arabic/Kurdish PDFs)
function looksLikeMojibake(text) {
  const mojibakeMarkerPattern = /[ÃÂ][\u0080-\u00BF]|Ø[\u0080-\u00BF]|Ù[\u0080-\u00BF]|�/g;
  const matches = text.match(mojibakeMarkerPattern) || [];
  return matches.length / Math.max(text.length, 1) > 0.02;
}

router.post("/upload", authMiddleware, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const selectedLanguage = req.body.language || req.body.lang || req.body.lessonLanguage;
    const dataBuffer = fs.readFileSync(req.file.path);
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    let extractedText = cleanExtractedText(data.text);

    if (!hasUsableExtractedText(extractedText)) {
      console.warn("[PDF] pdf-parse returned empty or invalid text; switching to OCR", {
        file: req.file.originalname,
        language: selectedLanguage || "en",
        extractedCharacters: extractedText.length,
      });
      extractedText = await extractTextWithOcr(req.file.path, selectedLanguage);
    }

    const result = await pool.query(
      `INSERT INTO lessons
       (user_id, title, original_name, file_size, file_path, extracted_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        req.file.originalname,
        req.file.originalname,
        req.file.size,
        req.file.path,
        extractedText,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "PDF uploaded and saved successfully",
      lesson: result.rows[0],
    });
  } catch (error) {
    console.error("PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading PDF",
      error: error.message,
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;
    const result = await pool.query(
      `SELECT id, title, file_path, created_at
       FROM lessons
       WHERE user_id = $1 AND archived_at IS NULL
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      lessons: result.rows,
    });
  } catch (error) {
    console.error("Get lessons error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Specific routes before dynamic /:id routes
router.get("/archived/list", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const result = await pool.query(
      `SELECT l.id, l.title, l.original_name, l.file_path, l.created_at, l.archived_at,
              COUNT(gc.id)::int AS generated_count
       FROM lessons l
       LEFT JOIN generated_content gc ON gc.lesson_id = l.id
       WHERE l.user_id = $1 AND l.archived_at IS NOT NULL
       GROUP BY l.id
       ORDER BY l.archived_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      lessons: result.rows,
    });
  } catch (error) {
    console.error("Get archived lessons error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/students", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;

    const result = await pool.query(
      `SELECT id, name, email FROM users WHERE role = 'student' ORDER BY name ASC`
    );

    return res.status(200).json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Dynamic /:id routes
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;
    const { id: lessonId } = req.params;
    const lessonResult = await pool.query(
      `SELECT id, user_id, title, file_path, extracted_text, created_at
       FROM lessons
       WHERE id = $1 AND user_id = $2 AND archived_at IS NULL`,
      [lessonId, req.user.id]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const contentResult = await pool.query(
      `SELECT id, content_type, content, created_at
       FROM generated_content
       WHERE lesson_id = $1
       ORDER BY created_at DESC`,
      [lessonId]
    );

    return res.status(200).json({
      success: true,
      lesson: lessonResult.rows[0],
      generatedContent: contentResult.rows,
    });
  } catch (error) {
    console.error("Get lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.patch("/:id/restore", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;
    const { id: lessonId } = req.params;

    const result = await pool.query(
      `UPDATE lessons SET archived_at = NULL
       WHERE id = $1 AND user_id = $2 AND archived_at IS NOT NULL
       RETURNING id, title, original_name, file_path, extracted_text, created_at`,
      [lessonId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Archived lesson not found",
      });
    }

    const contentResult = await pool.query(
      `SELECT id, content_type, content, created_at
       FROM generated_content
       WHERE lesson_id = $1
       ORDER BY created_at DESC`,
      [lessonId]
    );

    return res.status(200).json({
      success: true,
      message: "Lesson restored successfully",
      lesson: result.rows[0],
      generatedContent: contentResult.rows,
    });
  } catch (error) {
    console.error("Restore lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.delete("/:id/permanent", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    if (!ensureTeacher(req, res)) return;
    const { id: lessonId } = req.params;
    await client.query("BEGIN");

    const lessonResult = await client.query(
      `SELECT id FROM lessons WHERE id = $1 AND user_id = $2 AND archived_at IS NOT NULL`,
      [lessonId, req.user.id]
    );

    if (lessonResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Archived lesson not found",
      });
    }

    await client.query(
      "DELETE FROM generated_content WHERE lesson_id = $1",
      [lessonId]
    );
    await client.query(
      "DELETE FROM lesson_assignments WHERE lesson_id = $1",
      [lessonId]
    );
    await client.query(
      "DELETE FROM quiz_attempts WHERE lesson_id = $1",
      [lessonId]
    );
    await client.query(
      "DELETE FROM lessons WHERE id = $1 AND user_id = $2",
      [lessonId, req.user.id]
    );
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Lesson permanently deleted",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete archived lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    client.release();
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;
    const { id: lessonId } = req.params;

    const lessonResult = await pool.query(
      `SELECT id FROM lessons WHERE id = $1 AND user_id = $2 AND archived_at IS NULL`,
      [lessonId, req.user.id]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    await pool.query(
      `UPDATE lessons SET archived_at = NOW() WHERE id = $1`,
      [lessonId]
    );

    return res.status(200).json({
      success: true,
      message: "Lesson archived successfully",
    });
  } catch (error) {
    console.error("Archive lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/:id/share", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;
    const { id: lessonId } = req.params;
    const { studentIds } = req.body || {};

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "studentIds must be a non-empty array",
      });
    }

    const lessonResult = await pool.query(
      `SELECT id FROM lessons WHERE id = $1 AND user_id = $2`,
      [lessonId, req.user.id]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const validStudents = await pool.query(
      `SELECT id FROM users WHERE id = ANY($1::int[]) AND role = 'student'`,
      [studentIds]
    );

    if (validStudents.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid student IDs were provided",
      });
    }

    const validIds = validStudents.rows.map((row) => row.id);
    const inserted = await pool.query(
      `INSERT INTO lesson_assignments (lesson_id, student_id)
       SELECT $1, unnest($2::int[])
       ON CONFLICT (lesson_id, student_id) DO NOTHING
       RETURNING student_id`,
      [lessonId, validIds]
    );

    return res.status(200).json({
      success: true,
      message: "Lesson shared successfully",
      sharedWith: validIds,
      newlyShared: inserted.rows.map((row) => row.student_id),
    });
  } catch (error) {
    console.error("Share lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/:id/quiz-attempts", authMiddleware, async (req, res) => {
  try {
    if (!ensureTeacher(req, res)) return;
    const { id: lessonId } = req.params;

    const lessonResult = await pool.query(
      `SELECT id FROM lessons WHERE id = $1 AND user_id = $2`,
      [lessonId, req.user.id]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const result = await pool.query(
      `SELECT qa.id, qa.student_id, u.name AS student_name, u.email AS student_email,
              qa.score, qa.total, qa.created_at,
              ROW_NUMBER() OVER (PARTITION BY qa.student_id ORDER BY qa.created_at ASC) AS attempt_number
       FROM quiz_attempts qa
       JOIN users u ON u.id = qa.student_id
       WHERE qa.lesson_id = $1
       ORDER BY u.name ASC, qa.created_at ASC`,
      [lessonId]
    );

    const attempts = result.rows.map((row) => {
      const percentage = computePercentage(row.score, row.total);
      return {
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentEmail: row.student_email,
        attemptNumber: Number(row.attempt_number),
        score: row.score,
        total: row.total,
        percentage,
        passed: isPassed(percentage),
        createdAt: row.created_at,
      };
    });

    return res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    console.error("Get lesson quiz attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
