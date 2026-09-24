const pool = require("../config/db");
const { computePercentage, isPassed } = require("../utils/quizScoring");

function ensureStudent(req, res) {
  if (req.user.role !== "student") {
    res.status(403).json({ success: false, message: "Student access only" });
    return false;
  }
  return true;
}

const getSharedLessons = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) return;

    const result = await pool.query(
      `SELECT l.id, l.title, l.original_name, l.file_path, l.created_at,
              la.assigned_at,
              COUNT(gc.id)::int AS generated_count
       FROM lesson_assignments la
       JOIN lessons l ON l.id = la.lesson_id
       LEFT JOIN generated_content gc ON gc.lesson_id = l.id
       WHERE la.student_id = $1
       GROUP BY l.id, la.assigned_at
       ORDER BY la.assigned_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      lessons: result.rows,
    });
  } catch (error) {
    console.error("Get shared lessons error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getSharedLessonById = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) return;
    const { id: lessonId } = req.params;

    const assignmentResult = await pool.query(
      `SELECT 1 FROM lesson_assignments WHERE lesson_id = $1 AND student_id = $2`,
      [lessonId, req.user.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const lessonResult = await pool.query(
      `SELECT id, title, original_name, file_path, extracted_text, created_at
       FROM lessons
       WHERE id = $1`,
      [lessonId]
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
    console.error("Get shared lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getQuizAttempts = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) return;
    const { id: lessonId } = req.params;

    const result = await pool.query(
      `SELECT id, score, total, created_at
       FROM quiz_attempts
       WHERE lesson_id = $1 AND student_id = $2
       ORDER BY created_at ASC`,
      [lessonId, req.user.id]
    );

    const attempts = result.rows.map((row, index) => {
      const percentage = computePercentage(row.score, row.total);
      return {
        id: row.id,
        attemptNumber: index + 1,
        score: row.score,
        total: row.total,
        percentage,
        passed: isPassed(percentage),
        createdAt: row.created_at,
      };
    });

    const best = attempts.reduce(
      (top, attempt) => (!top || attempt.percentage > top.percentage ? attempt : top),
      null
    );

    return res.status(200).json({
      success: true,
      attempts: attempts.slice().reverse(),
      best: best ? { score: best.score, total: best.total, percentage: best.percentage, passed: best.passed } : null,
      canRetake: !best || !best.passed,
    });
  } catch (error) {
    console.error("Get quiz attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const submitQuizAttempt = async (req, res) => {
  try {
    if (!ensureStudent(req, res)) return;
    const { id: lessonId } = req.params;
    const { score, total } = req.body || {};

    if (
      !Number.isInteger(score) ||
      !Number.isInteger(total) ||
      total <= 0 ||
      score < 0 ||
      score > total
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid score and total are required",
      });
    }

    const assignmentResult = await pool.query(
      `SELECT 1 FROM lesson_assignments WHERE lesson_id = $1 AND student_id = $2`,
      [lessonId, req.user.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const previousAttempts = await pool.query(
      `SELECT score, total FROM quiz_attempts WHERE lesson_id = $1 AND student_id = $2`,
      [lessonId, req.user.id]
    );

    const bestPercentage = previousAttempts.rows.reduce(
      (max, row) => Math.max(max, computePercentage(row.score, row.total)),
      0
    );

    if (isPassed(bestPercentage)) {
      return res.status(409).json({
        success: false,
        message: "This quiz was already passed. Retake is not allowed.",
      });
    }

    const result = await pool.query(
      `INSERT INTO quiz_attempts (lesson_id, student_id, score, total)
       VALUES ($1, $2, $3, $4)
       RETURNING id, score, total, created_at`,
      [lessonId, req.user.id, score, total]
    );

    const attempt = result.rows[0];
    const percentage = computePercentage(attempt.score, attempt.total);

    return res.status(201).json({
      success: true,
      attempt: {
        id: attempt.id,
        attemptNumber: previousAttempts.rows.length + 1,
        score: attempt.score,
        total: attempt.total,
        percentage,
        passed: isPassed(percentage),
        createdAt: attempt.created_at,
      },
    });
  } catch (error) {
    console.error("Submit quiz attempt error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getSharedLessons,
  getSharedLessonById,
  getQuizAttempts,
  submitQuizAttempt,
};
