const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static");

const WHISPER_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const WHISPER_MODEL =
  process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";
const TIMEOUT_MS =
  Number(process.env.GROQ_WHISPER_TIMEOUT_MS) || 600000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const STT_TEMP_ROOT = path.join(process.cwd(), "uploads", "stt-temp");

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobePath?.path) {
  ffmpeg.setFfprobePath(ffprobePath.path);
}

function createSpeechToTextError(message, { code, status, cause } = {}) {
  const error = new Error(message);
  error.name = "SpeechToTextError";
  if (code) error.code = code;
  if (status) error.status = status;
  if (cause) error.cause = cause;
  return error;
}

function normalizeSpeechLanguage(language) {
  if (language == null || String(language).trim() === "") return null;

  const value = String(language).trim().toLowerCase();
  if (["ar", "ara", "arabic", "العربية"].includes(value)) return "ar";
  if (["en", "eng", "english"].includes(value)) return "en";
  if (["ckb", "ku", "kur", "kurdish", "sorani", "کوردی"].includes(value)) return "ar";
  if (/^[a-z]{2}$/.test(value)) return value;
  return null;
}

function formatTimestamp(seconds) {
  const totalSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const remainder = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${remainder}`;
}

function joinTranscriptText(segments) {
  return (Array.isArray(segments) ? segments : [])
    .map((segment) => String(segment?.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function parseWhisperSegments(data) {
  const segments = Array.isArray(data?.segments) ? data.segments : [];
  const parsed = segments
    .map((segment) => ({
      start: formatTimestamp(segment.start),
      end: formatTimestamp(segment.end),
      text: String(segment.text || "").trim(),
    }))
    .filter((segment) => segment.text);

  if (parsed.length > 0) return parsed;

  const fallbackText = String(data?.text || "").trim();
  if (!fallbackText) return [];

  return [
    {
      start: "00:00:00",
      end: formatTimestamp(data?.duration),
      text: fallbackText,
    },
  ];
}

function getGroqAiApiKey() {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) {
    throw createSpeechToTextError(
      "GROQ_API_KEY is not configured. Add it to the backend .env file.",
      { code: "GROQ_API_KEY_MISSING" }
    );
  }
  return apiKey;
}

async function assertReadableVideo(videoPath) {
  if (typeof videoPath !== "string" || !videoPath.trim()) {
    throw createSpeechToTextError("A video file path is required", {
      code: "INVALID_VIDEO",
    });
  }

  try {
    const stats = await fs.stat(videoPath);
    if (!stats.isFile() || stats.size === 0) {
      throw createSpeechToTextError("The video path is not a readable file", {
        code: "INVALID_VIDEO",
      });
    }
  } catch (error) {
    if (error.code === "INVALID_VIDEO") throw error;
    throw createSpeechToTextError(`Video file not found or unreadable: ${videoPath}`, {
      code: "INVALID_VIDEO",
      cause: error,
    });
  }
}

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("libmp3lame")
      .audioBitrate("64k")
      .format("mp3")
      .on("start", (commandLine) => {
        console.log("[STT] Extracting audio from video", { videoPath, commandLine });
      })
      .on("error", (error) => {
        reject(createSpeechToTextError(
          `Invalid or unreadable video file: ${error.message}`,
          { code: "INVALID_VIDEO", cause: error }
        ));
      })
      .on("end", () => resolve())
      .save(audioPath);
  });
}

function classifyWhisperError(error) {
  if (error?.name === "SpeechToTextError") return error;

  const status = Number(error?.response?.status);
  const apiMessage = error?.response?.data?.error?.message;
  const code = error?.code;

  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return createSpeechToTextError(
      `GROQAI Whisper request timed out after ${TIMEOUT_MS}ms`,
      { code: "ETIMEDOUT", cause: error }
    );
  }

  if (
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    error?.message?.toLowerCase().includes("network")
  ) {
    return createSpeechToTextError(
      `Network error while calling GROQAI Whisper: ${error.message}`,
      { code: code || "NETWORK_ERROR", cause: error }
    );
  }

  if (status === 401 || status === 403) {
    return createSpeechToTextError(
      "Groq API key is missing or invalid",
      { code: "GROQ_API_KEY_INVALID", status, cause: error }
    );
  }

  if (status) {
    return createSpeechToTextError(
      apiMessage || `GROQAI Whisper request failed (${status})`,
      { code: "GROQAI_API_ERROR", status, cause: error }
    );
  }

  return createSpeechToTextError(
    error?.message || "GroqAI Whisper request failed",
    { code: "GroqAI_API_ERROR", cause: error }
  );
}

async function transcribeAudioWithWhisper(audioPath, language) {
  const apiKey = getGroqAiApiKey();
  const audioStats = await fs.stat(audioPath);

  if (audioStats.size === 0) {
    throw createSpeechToTextError("No audio track could be extracted from the video", {
      code: "INVALID_VIDEO",
    });
  }

  if (audioStats.size > MAX_AUDIO_BYTES) {
    throw createSpeechToTextError(
      "Extracted audio exceeds the 25 MB Whisper upload limit",
      { code: "AUDIO_TOO_LARGE" }
    );
  }

  const form = new FormData();
  form.append("file", fsSync.createReadStream(audioPath), {
    filename: path.basename(audioPath),
    contentType: "audio/mpeg",
  });
  form.append("model", WHISPER_MODEL);
  form.append("response_format", "verbose_json");
  if (language) form.append("language", language);

  try {
    const response = await axios.post(WHISPER_API_URL, form, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      timeout: TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return response.data;
  } catch (error) {
    throw classifyWhisperError(error);
  }
}

async function transcribeVideo(videoPath, language) {
  const startedAt = Date.now();
  const whisperLanguage = normalizeSpeechLanguage(language);
  const tempDir = path.join(STT_TEMP_ROOT, `${Date.now()}-${crypto.randomUUID()}`);
  const audioPath = path.join(tempDir, "audio.mp3");

  console.log("[STT] Starting video speech-to-text", {
    videoPath,
    selectedLanguage: language,
    whisperLanguage: whisperLanguage || "auto",
  });

  try {
    getGroqAiApiKey();
    await assertReadableVideo(videoPath);
    await fs.mkdir(tempDir, { recursive: true });
    await extractAudio(videoPath, audioPath);

    const whisperResponse = await transcribeAudioWithWhisper(audioPath, whisperLanguage);
    const segments = parseWhisperSegments(whisperResponse);

    if (segments.length === 0) {
      throw createSpeechToTextError("Whisper completed but did not return transcript text", {
        code: "EMPTY_TRANSCRIPT",
      });
    }

    console.log("[STT] Completed video speech-to-text", {
      segments: segments.length,
      characters: joinTranscriptText(segments).length,
      durationMs: Date.now() - startedAt,
    });

    return segments;
  } catch (error) {
    const normalized = classifyWhisperError(error);
    console.error("[STT] Video speech-to-text failed", {
      message: normalized.message,
      code: normalized.code,
      status: normalized.status,
    });
    throw normalized;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch((cleanupError) => {
      console.warn("[STT] Failed to delete temporary audio files", {
        tempDir,
        error: cleanupError.message,
      });
    });
  }
}

module.exports = {
  transcribeVideo,
  formatTimestamp,
  joinTranscriptText,
  normalizeSpeechLanguage,
};
