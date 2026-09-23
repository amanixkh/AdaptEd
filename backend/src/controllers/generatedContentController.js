const pool = require("../config/db");
const updateGeneratedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body || {};
    const userId = req.user.id;
    try {
      const { id } = req.params;
      const { content } = req.body || {};
      const userId = req.user.id;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Content is required",
        });
      }

      const result = await pool.query(
        `UPDATE generated_content gc
         SET content = $1
         FROM lessons l
         WHERE gc.id = $2
           AND gc.lesson_id = l.id
           AND l.user_id = $3
         RETURNING gc.id, gc.lesson_id, gc.content_type, gc.content, gc.created_at`,
        [content, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Generated content not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Generated content updated successfully",
        content: result.rows[0],
      });
    } catch (error) {
      console.error("Update generated content error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }

const result = await pool.query(
  `UPDATE generated_content gc
   SET content = $1
   FROM lessons l
   WHERE gc.id = $2
     AND gc.lesson_id = l.id
     AND l.user_id = $3
   RETURNING gc.id, gc.lesson_id, gc.content_type, gc.content, gc.created_at`,
  [content, id, userId]
);

if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Generated content not found",
  });
}

res.status(200).json({
  success: true,
  message: "Generated content updated successfully",
  content: result.rows[0],
});
  } catch (error) {
    console.error("Update generated content error:", error);
res.status(500).json({
  success: false,
  message: "Server error",
});
  }
};
const deleteGeneratedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await pool.query(
        `DELETE FROM generated_content gc
         USING lessons l
         WHERE gc.id = $1
           AND gc.lesson_id = l.id
           AND l.user_id = $2
         RETURNING gc.id`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Generated content not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Generated content deleted successfully",
      });
    } catch (error) {
      console.error("Delete generated content error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }

if (result.rows.length === 0) {
  return res.status(404).json({
    success: false,
    message: "Generated content not found",
  });
}
res.status(200).json({
  success: true,
  message: "Generated content deleted successfully",
});
  } catch (error) {
    console.error("Delete generated content error:", error);
res.status(500).json({
  success: false,
  message: "Server error",
});
  }
};
module.exports = { updateGeneratedContent, deleteGeneratedContent, };