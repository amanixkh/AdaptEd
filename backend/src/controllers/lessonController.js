const pool = require("../config/db");
const getAllLessons = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, file_path, created_at
       FROM lessons
       WHERE user_id = $1
       ORDER BY created_at DESC`,[req.user.id]);
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
  }};

const getLessonById = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const lessonResult = await pool.query(
      `SELECT id, user_id, title, file_path, extracted_text, created_at
       FROM lessons
       WHERE id = $1 AND user_id = $2`,[lessonId, req.user.id]);

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
       ORDER BY created_at DESC`,[lessonId] );

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
  }};
const deleteLesson = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id: lessonId } = req.params;
    await client.query("BEGIN");

    const lessonResult = await client.query(
      `SELECT id
       FROM lessons
       WHERE id = $1 AND user_id = $2`,[lessonId, req.user.id]);

    if (lessonResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    await client.query(
      "DELETE FROM generated_content WHERE lesson_id = $1",[lessonId]);
    await client.query(
      "DELETE FROM lessons WHERE id = $1 AND user_id = $2",[lessonId, req.user.id]);
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete lesson error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  } finally {
    client.release();
  }};

module.exports = { getAllLessons, getLessonById, deleteLesson };
