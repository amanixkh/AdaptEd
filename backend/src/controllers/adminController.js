const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const getAdminStats = async (req, res) => { try { 
    const result = await pool.query(` SELECT (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*)
     FROM users
     WHERE role = 'student') AS total_students,

    (SELECT COUNT(*)
     FROM users
     WHERE role = 'teacher') AS total_teachers,

    (SELECT COUNT(*)
     FROM lessons) AS total_lessons,

    (SELECT COUNT(*)
     FROM generated_content) AS total_ai_generations
`);

const stats = result.rows[0];

return res.status(200).json({
  success: true,
  stats: {
    totalUsers: Number(stats.total_users),
    totalStudents: Number(stats.total_students),
    totalTeachers: Number(stats.total_teachers),
    totalLessons: Number(stats.total_lessons),
    totalAIGenerations: Number(stats.total_ai_generations),
  },
});
} catch (error) { console.error("Get admin stats error:", error);
return res.status(500).json({
  success: false,
  message: "Failed to get admin statistics",
});
} };
const getAdminUsers = async (req, res) => { try { 
    const { search = "", role = "" } = req.query;
const conditions = [];
const values = [];

if (search.trim() !== "") {
  values.push(`%${search.trim()}%`);

  conditions.push(`
    (
      LOWER(name) LIKE LOWER($${values.length})
      OR LOWER(email) LIKE LOWER($${values.length})
    )
  `);
}

if (role.trim() !== "") {
  const allowedRoles = ["student", "teacher", "admin"];

  if (!allowedRoles.includes(role.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid role filter",
    });
  }

  values.push(role.toLowerCase());

  conditions.push(`
    role = $${values.length}
  `);
}

const whereClause =
  conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

const query = `
  SELECT
    id,
    name,
    email,
    role,
    created_at
  FROM users
  ${whereClause}
  ORDER BY created_at DESC
`;

const result = await pool.query(query, values);

return res.status(200).json({
  success: true,
  users: result.rows,
  total: result.rows.length,
});
} catch (error) { console.error("Get admin users error:", error);
return res.status(500).json({
  success: false,
  message: "Failed to get users",
});
} };

const getAdminLessons = async (req, res) => { try { const { search = "" } = req.query;
const values = [];
let whereClause = "";

if (search.trim() !== "") {
  values.push(`%${search.trim()}%`);

  whereClause = `
    WHERE
      LOWER(l.title) LIKE LOWER($1)
      OR LOWER(u.name) LIKE LOWER($1)
      OR LOWER(u.email) LIKE LOWER($1)
      OR LOWER(COALESCE(l.original_name, '')) LIKE LOWER($1)
  `;
}

const result = await pool.query(
  `
  SELECT
    l.id,
    l.title,

    u.id AS owner_id,
    u.name AS owner_name,
    u.email AS owner_email,

    CASE
      WHEN LOWER(COALESCE(l.original_name, '')) LIKE '%.pdf'
        THEN 'PDF'

      WHEN LOWER(COALESCE(l.original_name, '')) LIKE '%.mp4'
        THEN 'Video'

      WHEN LOWER(COALESCE(l.original_name, '')) LIKE '%.webm'
        THEN 'Video'

      WHEN LOWER(COALESCE(l.original_name, '')) LIKE '%.mov'
        THEN 'Video'

      WHEN LOWER(COALESCE(l.original_name, '')) LIKE '%.avi'
        THEN 'Video'

      ELSE 'Other'
    END AS file_type,

    l.original_name,
    l.file_size,
    l.created_at

  FROM lessons l

  JOIN users u
    ON u.id = l.user_id

  ${whereClause}

  ORDER BY l.created_at DESC
  `,
  values
);

return res.status(200).json({
  success: true,
  lessons: result.rows,
  total: result.rows.length,
});
} catch (error) { console.error("Get admin lessons error:", error);
return res.status(500).json({
  success: false,
  message: "Failed to get lessons",
});
} };

const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lesson or video ID",
      });
    }

    const lessonResult = await pool.query(
      "SELECT file_path FROM lessons WHERE id = $1",
      [id]
    );

    if (lessonResult.rows.length > 0) {
      await pool.query("DELETE FROM generated_content WHERE lesson_id = $1", [id]);
      await pool.query("DELETE FROM lessons WHERE id = $1", [id]);
      await deleteUploadedFile(lessonResult.rows[0].file_path);

      return res.status(200).json({
        success: true,
        message: "Lesson deleted successfully",
      });
    }

    const videoResult = await pool.query(
      "SELECT video_path FROM videos WHERE id = $1",
      [id]
    );

    if (videoResult.rows.length > 0) {
      await pool.query("DELETE FROM videos WHERE id = $1", [id]);
      await deleteUploadedFile(videoResult.rows[0].video_path);

      return res.status(200).json({
        success: true,
        message: "Video deleted successfully",
      });
    }

    return res.status(404).json({
      success: false,
      message: "Lesson or video not found",
    });
  } catch (error) {
    console.error("Delete lesson/video error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
    });
  }
};

async function deleteUploadedFile(filePath) {
  if (!filePath) return;

  const uploadsDirectory = path.resolve(__dirname, "../../uploads");
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(uploadsDirectory, resolvedPath);
  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    console.error("File delete warning: refusing to delete a path outside uploads");
    return;
  }

  try {
    await fs.promises.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("File delete warning:", error.message);
    }
  }
}

module.exports = { getAdminStats, getAdminUsers, getAdminLessons, deleteLesson };