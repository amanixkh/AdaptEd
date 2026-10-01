const fs = require("fs");
const pool = require("../config/db");
const { transcribeVideo, joinTranscriptText } = require("../services/videoSpeechToTextService");
const { generateAndSaveFeature } = require("../services/contentGenerationService");
const { generateWebVtt, translateSubtitleSegments, SUBTITLE_LANGUAGES } = require("../services/subtitleService");

const VIDEO_FEATURES = ["summary", "quiz", "flashcards"];

function readFormArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function uploadVideo(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      errorCode: "VIDEO_MISSING",
      message: "No video file uploaded",
    });
  }

  const language = ["en", "ar", "ckb"].includes(String(req.body?.language || "").toLowerCase())
    ? String(req.body.language).toLowerCase()
    : "en";
  const title = String(req.body?.title || "").trim() || req.file.originalname;
  let extractedText;
  let transcriptSegments;
  let sourceLanguage = null;
  let lessonSaved = false;

  try {
    const transcription = await transcribeVideo(req.file.path, undefined, { includeMetadata: true });
    transcriptSegments = transcription.segments;
    sourceLanguage = transcription.sourceLanguage;
    extractedText = joinTranscriptText(transcriptSegments);
    if (!extractedText) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(422).json({
        success: false,
        errorCode: "VIDEO_NO_SPEECH",
        message: "No speech could be transcribed from this video.",
      });
    }
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    console.error("Video transcription error:", error);
    const noReadableAudio = error.code === "INVALID_VIDEO" || error.code === "EMPTY_TRANSCRIPT";
    const tooLarge = error.code === "AUDIO_TOO_LARGE";
    const status = noReadableAudio ? 422 : tooLarge ? 413 : 503;
    const errorCode = noReadableAudio
      ? "VIDEO_NO_AUDIO"
      : tooLarge
        ? "VIDEO_AUDIO_TOO_LARGE"
        : "VIDEO_TRANSCRIPTION_FAILED";
    const message = noReadableAudio
      ? "Could not extract readable audio. Make sure the video contains an audio track."
      : tooLarge
        ? "The extracted audio exceeds the speech transcription size limit."
        : "Speech transcription is temporarily unavailable. Please try again.";
    return res.status(status).json({ success: false, errorCode, message });
  }

  try {
    const result = await pool.query(
      `INSERT INTO lessons
       (user_id, title, original_name, file_size, file_path, extracted_text, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, req.file.originalname, req.file.size, req.file.path, extractedText, language]
    );
    const lesson = result.rows[0];
    lessonSaved = true;

    for (const subtitleLanguage of Object.keys(SUBTITLE_LANGUAGES)) {
      try {
        const translatedSegments = await translateSubtitleSegments(
          transcriptSegments,
          subtitleLanguage,
          sourceLanguage
        );
        const subtitlePath = `${req.file.path}.${subtitleLanguage}.vtt`;
        await fs.promises.writeFile(subtitlePath, generateWebVtt(translatedSegments), "utf8");
      } catch (error) {
        console.error(`[VIDEO SUBTITLES] ${subtitleLanguage} generation failed for lesson ${lesson.id}:`, error);
      }
    }

    const requestedFeatures = readFormArray(req.body?.features, ["summary"]);
    const features = [...new Set(requestedFeatures)].filter((feature) => VIDEO_FEATURES.includes(feature));
    const needs = readFormArray(req.body?.needs).filter((need) => typeof need === "string");
    const levels = ["beginner", "intermediate", "advanced"];
    const profile = {
      language,
      level: levels.includes(req.body?.level) ? req.body.level : "beginner",
      needs,
    };
    const generated = [];
    const failed = [];

    for (const feature of features.length ? features : ["summary"]) {
      try {
        await generateAndSaveFeature({
          lessonId: lesson.id,
          feature,
          profile,
          text: extractedText,
        });
        generated.push(feature);
      } catch (error) {
        console.error(`[VIDEO AI] ${feature} generation failed for lesson ${lesson.id}:`, error);
        failed.push(feature);
      }
    }

    const contentResult = await pool.query(
      `SELECT id, content_type, content, created_at
       FROM generated_content
       WHERE lesson_id = $1
       ORDER BY created_at DESC`,
      [lesson.id]
    );

    return res.status(201).json({
      success: true,
      message: failed.length
        ? "Video lesson created, but some content could not be generated"
        : "Video lesson created successfully",
      lesson,
      generated,
      failed,
      generatedContent: contentResult.rows,
    });
  } catch (error) {
    if (!lessonSaved) await fs.promises.unlink(req.file.path).catch(() => {});
    console.error("Save video lesson error:", error);
    return res.status(500).json({
      success: false,
      errorCode: "VIDEO_LESSON_SAVE_FAILED",
      message: "The video was transcribed but could not be saved as a lesson.",
    });
  }
}

async function getLessonSubtitle(req, res) {
  const { lessonId, language } = req.params;
  if (!SUBTITLE_LANGUAGES[language]) {
    return res.status(400).json({ success: false, message: "Unsupported subtitle language" });
  }

  try {
    const result = await pool.query(
      `SELECT l.file_path FROM lessons l
       WHERE l.id = $1 AND l.archived_at IS NULL
         AND (
           l.user_id = $2
           OR EXISTS (
             SELECT 1 FROM lesson_assignments la
             WHERE la.lesson_id = l.id AND la.student_id = $2
           )
         )`,
      [lessonId, req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    const subtitlePath = `${result.rows[0].file_path}.${language}.vtt`;
    if (!fs.existsSync(subtitlePath)) {
      return res.status(404).json({ success: false, message: "Subtitle is not available" });
    }

    const contents = await fs.promises.readFile(subtitlePath, "utf8");
    return res.set("Content-Type", "text/vtt; charset=utf-8").send(contents);
  } catch (error) {
    console.error("Get lesson subtitle error:", error);
    return res.status(500).json({ success: false, message: "Could not retrieve subtitle" });
  }
}

async function getVideos(req, res) {
  try {
    const { lessonId } = req.query;
    let query = `SELECT id, lesson_id, title, video_path, duration, created_at
                 FROM videos WHERE user_id = $1`;
    const params = [req.user.id];

    if (lessonId) {
      query += " AND lesson_id = $2";
      params.push(lessonId);
    }
    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    return res.status(200).json({ success: true, videos: result.rows });
  } catch (error) {
    console.error("Get videos error:", error);
    return res.status(500).json({ success: false, message: "Failed to get videos" });
  }
}

async function getVideoById(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, lesson_id, title, video_path, duration, created_at
       FROM videos WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    return res.status(200).json({ success: true, video: result.rows[0] });
  } catch (error) {
    console.error("Get video error:", error);
    return res.status(500).json({ success: false, message: "Failed to get video" });
  }
}

async function deleteVideo(req, res) {
  try {
    const result = await pool.query(
      "SELECT video_path FROM videos WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const videoPath = result.rows[0].video_path;
    await pool.query("DELETE FROM videos WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.id,
    ]);
    if (videoPath && fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    return res.status(200).json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete video" });
  }
}

async function getSubtitles(req, res) {
  try {
    const result = await pool.query(
      `SELECT subtitle_ar_path, subtitle_en_path, subtitle_ku_path
       FROM videos WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const video = result.rows[0];
    return res.status(200).json({
      success: true,
      subtitles: {
        ar: video.subtitle_ar_path,
        en: video.subtitle_en_path,
        ku: video.subtitle_ku_path,
      },
    });
  } catch (error) {
    console.error("Get subtitles error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subtitles" });
  }
}

module.exports = { uploadVideo, getLessonSubtitle, getVideos, getVideoById, deleteVideo, getSubtitles };
