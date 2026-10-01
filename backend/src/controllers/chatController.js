const pool = require("../config/db");
const openRouter = require("../services/ai/providers/openrouter");
const { createChatPrompt } = require("../services/ai/chatPromptBuilder");

function getAuthenticatedUserId(req) {
  const userId = req.user?.id;
  return userId == null ? null : Number(userId);
}

async function saveChatMessage({ userId, lessonId, role, message }) {
  if (userId == null) return;

  await pool.query(
    `INSERT INTO chat_messages (user_id, lesson_id, role, message)
     VALUES ($1, $2, $3, $4)`,
    [userId, lessonId, role, message]
  );
}

async function sendMessage(req, res) {
  const { lessonId, message, history } = req.body || {};

  if (lessonId == null || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "lessonId and message are required",
    });
  }

  const userMessage = String(message).trim();
  const userId = getAuthenticatedUserId(req);

  if (userId == null) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    // The tutor may only be used on lessons the caller owns or (for students)
    // lessons a teacher assigned to them, so lesson text never crosses user
    // boundaries on its way to the AI provider.
    const lessonResult = await pool.query(
      `SELECT l.extracted_text
       FROM lessons l
       WHERE l.id = $1
         AND (
           l.user_id = $2
           OR EXISTS (
             SELECT 1 FROM lesson_assignments la
             WHERE la.lesson_id = l.id AND la.student_id = $2
           )
         )`,
      [lessonId, userId]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const lessonText = lessonResult.rows[0].extracted_text;
    if (typeof lessonText !== "string" || !lessonText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lesson content is empty",
      });
    }

    await saveChatMessage({
      userId,
      lessonId,
      role: "user",
      message: userMessage,
    });

    const prompt = createChatPrompt(lessonText, userMessage, history);
    const reply = await openRouter.generate(prompt);

    await saveChatMessage({
      userId,
      lessonId,
      role: "assistant",
      message: reply,
    });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function getChatHistory(req, res) {
  const userId = getAuthenticatedUserId(req);
  const { lessonId } = req.params;

  if (userId == null) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT role, message
       FROM chat_messages
       WHERE user_id = $1 AND lesson_id = $2
       ORDER BY created_at ASC`,
      [userId, lessonId]
    );

    return res.status(200).json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

async function deleteChatHistory(req, res) {
  const userId = getAuthenticatedUserId(req);
  const { lessonId } = req.params;

  if (userId == null) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    await pool.query(
      `DELETE FROM chat_messages
       WHERE user_id = $1 AND lesson_id = $2`,
      [userId, lessonId]
    );

    return res.status(200).json({
      success: true,
      message: "Chat history deleted",
    });
  } catch (error) {
    console.error("Delete chat history error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

module.exports = { sendMessage, getChatHistory, deleteChatHistory };
