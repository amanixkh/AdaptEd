const pool = require("../config/db");
const getHistory = async (req, res) => { try { const userId = req.user.id;
const result = await pool.query(
  `SELECT
     l.id,
     l.title,
     l.file_path,
     l.created_at,
     COALESCE(
       json_agg(
         json_build_object(
           'type', gc.content_type
         )
       ) FILTER (WHERE gc.id IS NOT NULL),
       '[]'
     ) AS generated
   FROM lessons l
   LEFT JOIN generated_content gc
     ON gc.lesson_id = l.id
   WHERE l.user_id = $1
   GROUP BY l.id
   ORDER BY l.created_at DESC`,[userId]);

res.status(200).json({
  success: true,
  history: result.rows,
});
} catch (error) { console.error("History error:", error);
res.status(500).json({
  success: false,
  message: "Server error",
});
} };
module.exports = { getHistory, };