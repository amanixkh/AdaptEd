const pool = require("../config/db");
async function addStudent(req, res) { try { 
    const teacherId = req.user.id; 
    const { email } = req.body;
const student = await pool.query(
  "SELECT id, name, email FROM users WHERE email = $1 AND role = 'student'",
  [email]
);

if (student.rows.length === 0) {
  return res.status(404).json({ message: "Student not found" });
}

const studentId = student.rows[0].id;

const exists = await pool.query(
  "SELECT id FROM teacher_students WHERE teacher_id = $1 AND student_id = $2",
  [teacherId, studentId]
);

if (exists.rows.length > 0) {
  return res.status(409).json({ message: "Student already added" });
}

await pool.query(
  "INSERT INTO teacher_students (teacher_id, student_id) VALUES ($1, $2)",
  [teacherId, studentId]
);

res.json({ 
    message: "Student added successfully", 
    student: student.rows[0] });
} catch (error) { 
    console.error("Add student error:", error); res.status(500).json({ message: "Server error" }); } }
async function searchMyStudents(req, res) { try { 
    const teacherId = req.user.id; 
    const { query } = req.query;
const result = await pool.query(
  `SELECT u.id, u.name, u.email
   FROM users u
   JOIN teacher_students ts ON ts.student_id = u.id
   WHERE ts.teacher_id = $1
     AND u.role = 'student'
     AND (u.email ILIKE $2 OR u.name ILIKE $2)
   ORDER BY u.name ASC
   LIMIT 20`,
  [teacherId, `%${query}%`]
);

res.json(result.rows);
} catch (error) { 
    console.error("Search students error:", error);
     res.status(500).json({ message: "Server error" }); } }
async function getMyStudents(req, res) { try { 
const teacherId = req.user.id;
const result = await pool.query(
  `SELECT u.id, u.name, u.email
   FROM users u
   JOIN teacher_students ts ON ts.student_id = u.id
   WHERE ts.teacher_id = $1
   ORDER BY u.name ASC`,
  [teacherId]
);

res.json(result.rows);
} catch (error) { console.error("Get students error:", error); res.status(500).json({ message: "Server error" }); } }
module.exports = { addStudent, searchMyStudents, getMyStudents };