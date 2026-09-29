// Direct database access for test fixtures/assertions and cleanup.
const fs = require("node:fs/promises");
const path = require("node:path");
const { Pool } = require("pg");

const BACKEND_ROOT = path.resolve(__dirname, "..", "..");
require("dotenv").config({ path: path.join(BACKEND_ROOT, ".env") });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
});

async function getLesson(lessonId) {
  const result = await pool.query(
    `SELECT id, user_id, title, extracted_text, archived_at
     FROM lessons WHERE id = $1`,
    [lessonId]
  );
  return result.rows[0] || null;
}

async function countGeneratedContent(lessonId) {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS total FROM generated_content WHERE lesson_id = $1",
    [lessonId]
  );
  return result.rows[0].total;
}

async function listGeneratedContent(lessonId) {
  const result = await pool.query(
    "SELECT id, content_type, content FROM generated_content WHERE lesson_id = $1 ORDER BY id",
    [lessonId]
  );
  return result.rows;
}

async function countChatMessages(lessonId) {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS total FROM chat_messages WHERE lesson_id = $1",
    [lessonId]
  );
  return result.rows[0].total;
}

// Counts how many of the given lesson ids are really owned by the user, so a
// list endpoint can be proven to contain no foreign rows.
async function countOwnedLessons(userId, lessonIds) {
  if (lessonIds.length === 0) return 0;
  const result = await pool.query(
    "SELECT COUNT(*)::int AS total FROM lessons WHERE user_id = $1 AND id = ANY($2::int[])",
    [userId, lessonIds]
  );
  return result.rows[0].total;
}

async function countLessonsByUser(userId) {
  const result = await pool.query(
    "SELECT COUNT(*)::int AS total FROM lessons WHERE user_id = $1",
    [userId]
  );
  return result.rows[0].total;
}

// Removes every row created by the suite (lesson/assignment/quiz/chat/content
// rows cascade from users and lessons).
async function deleteUsersByEmail(emails) {
  if (emails.length === 0) return;
  await pool.query("DELETE FROM users WHERE email = ANY($1::text[])", [emails]);
}

// Cleans the PDFs uploaded through POST /api/lessons/upload during the suite.
async function deleteUploadedFiles(emails) {
  const result = await pool.query(
    `SELECT l.file_path
     FROM lessons l
     JOIN users u ON u.id = l.user_id
     WHERE u.email = ANY($1::text[]) AND l.file_path IS NOT NULL`,
    [emails]
  );

  for (const row of result.rows) {
    const absolute = path.resolve(row.file_path);
    if (!absolute.startsWith(path.join(BACKEND_ROOT, "uploads"))) continue;
    await fs.unlink(absolute).catch(() => {});
    for (const language of ["en", "ar", "ckb"]) {
      await fs.unlink(`${absolute}.${language}.vtt`).catch(() => {});
    }
  }
}

module.exports = {
  pool,
  getLesson,
  listGeneratedContent,
  countGeneratedContent,
  countChatMessages,
  countOwnedLessons,
  countLessonsByUser,
  deleteUsersByEmail,
  deleteUploadedFiles,
  closePool: () => pool.end(),
};
