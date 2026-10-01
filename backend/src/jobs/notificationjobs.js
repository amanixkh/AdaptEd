const cron = require("node-cron");
const pool = require("../config/db");
const { createNotification } = require("../controllers/notificationController");

async function checkInactiveStudents() {
  try {
    const result = await pool.query(
      `SELECT u.id
       FROM users u
       WHERE u.id NOT IN (
         SELECT DISTINCT user_id
         FROM lessons
         WHERE created_at > NOW() - INTERVAL '3 days'
       )`
    );

    for (const user of result.rows) {
      await createNotification(
        user.id,
        "inactive_warning",
        "لم تدرس منذ فترة",
        "لم تدرس منذ 3 أيام!"
      );
     }
  } catch (error) {
    console.error("checkInactiveStudents error:", error);
  }}

async function checkLearningStreak() {
  try {
    const result = await pool.query(
      `SELECT user_id, COUNT(DISTINCT DATE(created_at)) AS active_days
       FROM lessons
       WHERE created_at > NOW() - INTERVAL '7 days'
       GROUP BY user_id
       HAVING COUNT(DISTINCT DATE(created_at)) >= 3`
    );

    for (const row of result.rows) {
      await createNotification(
        row.user_id,
        "learning_streak",
        "استمر بالتعلم!",
        `أنت نشيط منذ ${row.active_days}، استمر!`
      );
    }
  } catch (error) {
    console.error("checkLearningStreak error:", error);
  }
}

async function checkScoreImprovement() {
  try {
    const result = await pool.query(
      `SELECT student_id, lesson_id, score, attempt_number
       FROM quiz_attempts
       ORDER BY student_id, lesson_id, attempt_number ASC`
    );
    const attemptsByStudentLesson = {};

    for (const row of result.rows) {
      const key = `${row.student_id}:${row.lesson_id}`;
      if (!attemptsByStudentLesson[key]) {
        attemptsByStudentLesson[key] = [];
      }
      attemptsByStudentLesson[key].push(row);
    }

    for (const attempts of Object.values(attemptsByStudentLesson)) {
      if (attempts.length < 2) {
        continue;
      }

      const latest = attempts[attempts.length - 1];
      const previous = attempts[attempts.length - 2];
      if (latest.score > previous.score) {
        await createNotification(
          latest.student_id,
          "score_improved",
          "تحسنت درجتك!",
          "أحسنت! تحسنت نتيجتك في الاختبار.",
          latest.lesson_id
        );
      }
    }
  } catch (error) {
    console.error("checkScoreImprovement error:", error);
  }
}

async function notifyNewLessonAssignments() {
  try {
    const result = await pool.query(
      `SELECT la.lesson_id, la.student_id
       FROM lesson_assignments la
       LEFT JOIN notifications n
         ON n.related_id = la.lesson_id
        AND n.user_id = la.student_id
        AND n.type = 'new_lesson'
       WHERE n.id IS NULL`
    );

    for (const row of result.rows) {
      await createNotification(
        row.student_id,
        "new_lesson",
        "درس جديد",
        "شاركك معلمك درسًا جديدًا",
        row.lesson_id
      );
    }
  } catch (error) {
    console.error("notifyNewLessonAssignments error:", error);
  }
}

function startNotificationJobs() {
  cron.schedule("0 9 * * *", () => {
    console.log("Running daily notification jobs...");
    checkInactiveStudents();
    checkLearningStreak();
    checkScoreImprovement();
  });

  cron.schedule("*/10 * * * *", notifyNewLessonAssignments);
}

module.exports = { startNotificationJobs,checkInactiveStudents,checkLearningStreak,checkScoreImprovement,notifyNewLessonAssignments };