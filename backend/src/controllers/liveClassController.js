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

  try {
    const result = await pool.query(
      `SELECT title, scheduled_at, meeting_url
       FROM live_classes
       WHERE scheduled_at >= NOW()
       ORDER BY scheduled_at ASC`
    );

    return res.status(200).json({ success: true, liveClasses: result.rows });
  } catch (error) {
    console.error("Get upcoming live classes error:", error);
    return res.status(500).json({ success: false, message: "Could not retrieve live classes" });
  }
}

module.exports = { createLiveClass, getUpcomingLiveClasses };
