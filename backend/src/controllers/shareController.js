const pool = require("../config/db"); 
const { createNotification } = require("./notificationController");
async function shareLesson(req, res) { try { 
    const { id } = req.params;
     const { studentIds } = req.body; 
     const teacherId = req.user.id;
const lessonCheck = await pool.query(
  "SELECT * FROM lessons WHERE id = $1 AND user_id = $2",
  [id, teacherId]
);

if (lessonCheck.rows.length === 0) {
  return res.status(404).json({ message: "Lesson not found" });
}

for (const studentId of studentIds) {
  const isMyStudent = await pool.query(
    "SELECT id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2",
    [teacherId, studentId]
  );

  if (isMyStudent.rows.length === 0) {
    continue;
  }

  const exists = await pool.query(
    "SELECT id FROM lesson_assignments WHERE lesson_id = $1 AND student_id = $2",
    [id, studentId]
  );

  if (exists.rows.length === 0) {
    await pool.query(
      "INSERT INTO lesson_assignments (lesson_id, teacher_id, student_id) VALUES ($1, $2, $3)",
      [id, teacherId, studentId]
    );

    await createNotification(
      studentId,
      "new_lesson",
      "درس جديد",
      `تمت مشاركة درس جديد معك: ${lessonCheck.rows[0].title}`,
      id
    );
  }
}

res.json({ message: "Lesson shared successfully" });
} catch (error) { 
    console.error("Share lesson error:", error); 
    res.status(500).json({ message: "Server error" }); } }
async function getSharedStudents(req, res) { try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT u.id, u.name, u.email FROM lesson_assignments la JOIN users u ON la.student_id = u.id WHERE la.lesson_id = $1",
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get shared students error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
module.exports = { shareLesson, getSharedStudents };