const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const lessonsResult = await pool.query(
      `SELECT COUNT(*) AS total_lessons
       FROM lessons
       WHERE user_id = $1`,
      [userId]
    );

    const contentResult = await pool.query(
      `SELECT COUNT(*) AS total_generated_content
       FROM generated_content gc
       JOIN lessons l ON gc.lesson_id = l.id
       WHERE l.user_id = $1`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalLessons: Number(lessonsResult.rows[0].total_lessons),
        totalGeneratedContent: Number(
          contentResult.rows[0].total_generated_content
        ),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getDashboardStats };