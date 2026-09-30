const crypto = require("crypto");
const pool = require("../config/db");

async function createLiveClass(req, res) {
  if (req.user?.role !== "teacher") {
    return res.status(403).json({ success: false, message: "Teacher access only" });
  }

  const title = String(req.body?.title || "").trim();
  const scheduledAt = new Date(req.body?.scheduled_at);
  if (!title || !req.body?.scheduled_at || Number.isNaN(scheduledAt.getTime())) {
    return res.status(400).json({
      success: false,
      message: "A title and valid scheduled_at date are required",
    });
  }

  const roomName = `adapted-${Date.now()}-${crypto.randomUUID()}`;
  const meetingUrl = `https://meet.jit.si/${roomName}`;

  try {
    const result = await pool.query(
      `INSERT INTO live_classes (teacher_id, title, scheduled_at, meeting_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, teacher_id, title, scheduled_at, meeting_url, created_at`,
      [req.user.id, title, scheduledAt.toISOString(), meetingUrl]
    );

    return res.status(201).json({ success: true, liveClass: result.rows[0] });
  } catch (error) {
    console.error("Create live class error:", error);
    return res.status(500).json({ success: false, message: "Could not create live class" });
  }
}

async function getUpcomingLiveClasses(req, res) {
  if (req.user?.role !== "student") {
    return res.status(403).json({ success: false, message: "Student access only" });
  }

  // Classes from the student's own teachers (a teacher who added them, or shared a lesson
  // with them). They stay visible for 2 hours after the start so late students can still join.
  const fromTeacherStudents = `EXISTS (SELECT 1 FROM teacher_students ts
                                   WHERE ts.teacher_id = lc.teacher_id AND ts.student_id = $1)`;
  const fromSharedLessons = `EXISTS (SELECT 1 FROM lesson_assignments la
                                  JOIN lessons l ON l.id = la.lesson_id
                                  WHERE l.user_id = lc.teacher_id AND la.student_id = $1)`;
  const query = (links) => `SELECT lc.id, lc.title, lc.scheduled_at, lc.meeting_url
       FROM live_classes lc
       WHERE lc.scheduled_at >= NOW() - INTERVAL '2 hours'
         AND (${links})
       ORDER BY lc.scheduled_at ASC`;

  try {
    let result;
    try {
      result = await pool.query(query(`${fromTeacherStudents} OR ${fromSharedLessons}`), [req.user.id]);
    } catch (error) {
      // Databases without the teacher_students table: use shared lessons only.
      if (error.code !== "42P01") throw error;
      result = await pool.query(query(fromSharedLessons), [req.user.id]);
    }

    return res.status(200).json({ success: true, liveClasses: result.rows });
  } catch (error) {
    console.error("Get upcoming live classes error:", error);
    return res.status(500).json({ success: false, message: "Could not retrieve live classes" });
  }
}

// GET /api/live-classes/mine — the teacher's own classes (newest first).
async function getMyLiveClasses(req, res) {
  if (req.user?.role !== "teacher") {
    return res.status(403).json({ success: false, message: "Teacher access only" });
  }
  try {
    const result = await pool.query(
      `SELECT id, title, scheduled_at, meeting_url, created_at
       FROM live_classes
       WHERE teacher_id = $1
       ORDER BY scheduled_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, liveClasses: result.rows });
  } catch (error) {
    console.error("Get my live classes error:", error);
    return res.status(500).json({ success: false, message: "Could not retrieve live classes" });
  }
}

// DELETE /api/live-classes/:id — a teacher cancels one of their own classes.
async function deleteLiveClass(req, res) {
  if (req.user?.role !== "teacher") {
    return res.status(403).json({ success: false, message: "Teacher access only" });
  }
  try {
    const result = await pool.query(
      `DELETE FROM live_classes WHERE id = $1 AND teacher_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "Live class not found" });
    }
    return res.status(200).json({ success: true, message: "Live class cancelled" });
  } catch (error) {
    console.error("Delete live class error:", error);
    return res.status(500).json({ success: false, message: "Could not cancel the live class" });
  }
}

module.exports = { createLiveClass, getUpcomingLiveClasses, getMyLiveClasses, deleteLiveClass };
