// Test-only preload that replaces the real OpenRouter provider with a stub.
//
// chatController requires the OpenRouter provider directly, so the tutor route
// would otherwise call the real AI provider on every test run. The backend child
// process is started with `--require <this file>`, which pre-populates the
// module cache before server.js loads, so production code is untouched.
const modulePath = require.resolve("../../src/services/ai/providers/openrouter.js");

require.cache[modulePath] = {
  id: modulePath,
  filename: modulePath,
  loaded: true,
  exports: {
    name: "OpenRouter",
    generate: async () => "Stubbed tutor reply for automated tests.",
  },
  children: [],
  paths: [],
};

const geminiPath = require.resolve("../../src/services/ai/providers/gemini.js");
require.cache[geminiPath] = {
  id: geminiPath,
  filename: geminiPath,
  loaded: true,
  exports: {
    name: "Gemini",
    generate: async () => {
      throw new Error("Gemini is disabled in backend tests");
    },
  },
  children: [],
  paths: [],
};

if (process.env.TEST_VIDEO_STT_MOCK === "true") {
  const transcriptionPath = require.resolve("../../src/services/videoSpeechToTextService.js");
  require.cache[transcriptionPath] = {
    id: transcriptionPath,
    filename: transcriptionPath,
    loaded: true,
    exports: {
      transcribeVideo: async (videoPath, _language, { includeMetadata = false } = {}) => {
        const filename = require("node:path").basename(videoPath).toLowerCase();
        if (filename.includes("stt-failure")) {
          const error = new Error("Stubbed transcription failure");
          error.code = "NETWORK_ERROR";
          throw error;
        }
        if (filename.includes("silent-video")) {
          return includeMetadata ? { segments: [], sourceLanguage: "en" } : [];
        }
        const text = filename.includes("ai-failure")
          ? "AI_FAILURE_TRANSCRIPT"
          : filename.includes("translation-failure-ar")
            ? "FAIL_TRANSLATION_AR video lesson transcript about photosynthesis and plant growth."
            : filename.includes("source-ar")
              ? "مرحبا بكم في درس الأحياء."
              : filename.includes("source-ckb")
                ? "بەخێربێن بۆ وانەی زیندەوەرزانی."
                : "Video lesson transcript about photosynthesis and plant growth.";
        const segments = [{ start: 1.25, end: 3.5, text }];
        const sourceLanguage = filename.includes("source-ar") ? "ar" : filename.includes("source-ckb") ? "ckb" : "en";
        return includeMetadata ? { segments, sourceLanguage } : segments;
      },
      joinTranscriptText: (segments) => segments.map((segment) => String(segment?.text || "").trim()).filter(Boolean).join(" ").trim(),
    },
    children: [],
    paths: [],
  };
}
