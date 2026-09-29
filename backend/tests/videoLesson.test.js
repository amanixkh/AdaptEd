const { after, before, describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { startBackend } = require("./helpers/testServer");
const { loginUser, registerUser, request, uploadLesson, uploadVideo, getLessonSubtitle } = require("./helpers/apiClient");
const {
  closePool,
  countGeneratedContent,
  deleteUploadedFiles,
  deleteUsersByEmail,
  getLesson,
  listGeneratedContent,
} = require("./helpers/db");
const videoUpload = require("../src/middleware/uploadVideo");
const { parseWhisperSegments, normalizeDetectedLanguage } = require("../src/services/videoSpeechToTextService");
const { generateWebVtt, translateSubtitleSegments } = require("../src/services/subtitleService");
const { createPrompt } = require("../src/utils/promptGenerator");

const runId = Date.now();
const email = `video-lesson-${runId}@adapted.test`;
const otherEmail = `video-other-${runId}@adapted.test`;
const password = "VideoLesson#2026";
const context = { server: null, token: "", userId: null };

before(async () => {
  context.server = await startBackend();
  const registered = await registerUser(context.server.baseUrl, {
    name: "Video Lesson Teacher",
    email,
    password,
    role: "teacher",
  });
  assert.equal(registered.status, 201, JSON.stringify(registered.data));

  const session = await loginUser(context.server.baseUrl, email, password);
  context.token = session.token;
  context.userId = session.user.id;

  const otherRegistered = await registerUser(context.server.baseUrl, {
    name: "Other Teacher",
    email: otherEmail,
    password,
    role: "teacher",
  });
  assert.equal(otherRegistered.status, 201, JSON.stringify(otherRegistered.data));
  context.otherToken = (await loginUser(context.server.baseUrl, otherEmail, password)).token;
});

after(async () => {
  try {
    await deleteUploadedFiles([email, otherEmail]);
    await deleteUsersByEmail([email, otherEmail]);
  } finally {
    await closePool();
    if (context.server) await context.server.stop();
  }
});

describe("video-created lessons", () => {
  it("preserves Whisper fractional timestamps and rejects malformed segments", () => {
    assert.deepEqual(parseWhisperSegments({ segments: [
      { start: 1.25, end: 3.5, text: "Timed speech" },
      { start: 3.5, end: 4.125, text: "Next segment" },
    ] }), [
      { start: 1.25, end: 3.5, text: "Timed speech" },
      { start: 3.5, end: 4.125, text: "Next segment" },
    ]);

    assert.throws(
      () => parseWhisperSegments({ segments: [{ start: 4, end: 2, text: "Bad timing" }] }),
      (error) => error.code === "INVALID_TRANSCRIPT_SEGMENTS"
    );
    assert.equal(normalizeDetectedLanguage("English"), "en");
    assert.equal(normalizeDetectedLanguage("Arabic"), "ar");
    assert.equal(normalizeDetectedLanguage("Kurdish"), "ckb");
  });

  it("translates mock segments by ID, retries malformed JSON once, and preserves VTT cues", async () => {
    const segments = [
      { start: 0, end: 2.5, text: "Hello" },
      { start: 2.5, end: 5, text: "Welcome to the lesson" },
    ];
    const expected = {
      ar: ["مرحبا", "أهلا بكم في الدرس"],
      ckb: ["سڵاو", "بەخێربێن بۆ وانەکە"],
    };

    for (const language of ["en", "ar", "ckb"]) {
      let calls = 0;
      const translated = await translateSubtitleSegments(segments, language, "en", async (prompt, options) => {
        calls += 1;
        if (language === "en") throw new Error("Original-language track must not call AI");
        if (calls === 1) return { data: options.validate("not json") };
        const ids = JSON.parse(prompt.match(/Input:\s*([\s\S]*)$/)[1]);
        const value = { segments: ids.map((segment, index) => ({ id: segment.id, text: expected[language][index] })) };
        return { data: options.validate(JSON.stringify(value)) };
      });

      assert.equal(calls, language === "en" ? 0 : 2);
      assert.deepEqual(translated.map((segment) => segment.text), language === "en" ? ["Hello", "Welcome to the lesson"] : expected[language]);
      assert.equal(translated.length, segments.length);
      assert.equal(translated[0].start, segments[0].start);
      assert.equal(translated[1].end, segments[1].end);

      const vtt = generateWebVtt(translated);
      assert.match(vtt, /00:00:00\.000 --> 00:00:02\.500/);
      assert.match(vtt, /00:00:02\.500 --> 00:00:05\.000/);
      assert.ok(vtt.includes(language === "en" ? "Hello" : expected[language][0]));
      assert.ok(vtt.includes(language === "en" ? "Welcome to the lesson" : expected[language][1]));
    }

    for (const [sourceLanguage, originalSegments] of [
      ["ar", [{ start: 0, end: 2.5, text: "مرحبا بكم" }]],
      ["ckb", [{ start: 0, end: 2.5, text: "بەخێربێن" }]],
    ]) {
      const unchanged = await translateSubtitleSegments(originalSegments, sourceLanguage, sourceLanguage, async () => {
        throw new Error("Original-language subtitles must not call AI");
      });
      assert.deepEqual(unchanged, originalSegments);
      assert.ok(generateWebVtt(unchanged).includes(originalSegments[0].text));
    }
  });

  it("keeps PDF uploads working and stores English, Arabic, and Kurdish languages", async () => {
    for (const language of ["en", "ar", "ckb"]) {
      const uploaded = await uploadLesson(context.server.baseUrl, context.token, {
        title: `PDF ${language} ${runId}`,
        text: "A PDF lesson text about plants and photosynthesis.",
        language,
      });
      assert.equal(uploaded.status, 200, JSON.stringify(uploaded.data));
      assert.equal(uploaded.data.lesson.language, language);
      const generated = await request(context.server.baseUrl, "POST", "/api/generate", {
        token: context.token,
        json: { lessonId: uploaded.data.lesson.id, features: ["summary"], profile: { language } },
      });
      assert.equal(generated.status, 201, JSON.stringify(generated.data));
      const lesson = await request(context.server.baseUrl, "GET", `/api/lessons/${uploaded.data.lesson.id}`, {
        token: context.token,
      });
      const summary = JSON.parse(lesson.data.generatedContent[0].content).summary;
      assert.ok(summary.length > 0);
      if (language === "ar") assert.match(summary, /ملخص/);
      if (language === "ckb") assert.match(summary, /پوختە/);
    }
  });

  it("creates a lesson and all selected AI features from MP4", async () => {
    const uploaded = await uploadVideo(context.server.baseUrl, context.token, {
      title: `MP4 lesson ${runId}`,
      filename: "lesson.mp4",
      mimeType: "video/mp4",
      features: ["summary", "quiz", "flashcards"],
    });

    assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
    assert.equal(uploaded.data.lesson.language, "en");
    assert.match(uploaded.data.lesson.file_path, /uploads[\\/]videos[\\/]/);
    assert.match(uploaded.data.lesson.extracted_text, /Video lesson transcript/);
    assert.deepEqual(new Set(uploaded.data.generated), new Set(["summary", "quiz", "flashcards"]));
    assert.equal(uploaded.data.generatedContent.length, 3);
    assert.equal(await countGeneratedContent(uploaded.data.lesson.id), 3);

    for (const language of ["en", "ar", "ckb"]) {
      const subtitle = await getLessonSubtitle(context.server.baseUrl, context.token, uploaded.data.lesson.id, language);
      assert.equal(subtitle.status, 200, `${language} subtitle response: ${subtitle.text}\n${context.server.logs.join("")}`);
      assert.match(subtitle.contentType, /^text\/vtt; charset=utf-8/i);
      assert.match(subtitle.text, /^WEBVTT\r?\n/);
      assert.match(subtitle.text, /00:00:01\.250 --> 00:00:03\.500/);
      assert.match(subtitle.text, new RegExp(language === "en" ? "Video lesson transcript" : `${language.toUpperCase()}: Video lesson transcript`));
    }

    const forbidden = await getLessonSubtitle(context.server.baseUrl, context.otherToken, uploaded.data.lesson.id, "en");
    assert.equal(forbidden.status, 404);
    const unauthenticated = await getLessonSubtitle(context.server.baseUrl, "", uploaded.data.lesson.id, "en");
    assert.equal(unauthenticated.status, 401);
    const invalidLanguage = await getLessonSubtitle(context.server.baseUrl, context.token, uploaded.data.lesson.id, "fr");
    assert.equal(invalidLanguage.status, 400);

    const fetchedFile = await fetch(`${context.server.baseUrl}/api/lessons/${uploaded.data.lesson.id}/file`, {
      headers: { Authorization: `Bearer ${context.token}` },
    });
    assert.equal(fetchedFile.status, 200);
    assert.equal(await fetchedFile.text(), "test video bytes");
  });

  it("accepts WebM and MOV and persists the selected output language", async () => {
    for (const [filename, mimeType, language] of [
      ["lesson-ar.mp4", "video/mp4", "ar"],
      ["lesson-ckb.mp4", "video/mp4", "ckb"],
      ["lesson.webm", "video/webm", "ar"],
      ["lesson.mov", "video/quicktime", "ckb"],
    ]) {
      const uploaded = await uploadVideo(context.server.baseUrl, context.token, {
        title: `${filename} ${runId}`,
        filename,
        mimeType,
        language,
      });
      assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
      assert.equal(uploaded.data.lesson.language, language);
      assert.equal(uploaded.data.lesson.extracted_text.length > 0, true);
      const summary = JSON.parse(uploaded.data.generatedContent[0].content).summary;
      if (language === "ar") assert.match(summary, /ملخص/);
      if (language === "ckb") assert.match(summary, /پوختە/);
    }
  });

  it("uses Arabic or Sorani transcript unchanged for its matching subtitle track", async () => {
    for (const [filename, language, original] of [
      ["source-ar.mp4", "ar", "مرحبا بكم في درس الأحياء."],
      ["source-ckb.mp4", "ckb", "بەخێربێن بۆ وانەی زیندەوەرزانی."],
    ]) {
      const uploaded = await uploadVideo(context.server.baseUrl, context.token, {
        title: `${filename} ${runId}`,
        filename,
        language,
      });
      assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
      const originalSubtitle = await getLessonSubtitle(context.server.baseUrl, context.token, uploaded.data.lesson.id, language);
      assert.equal(originalSubtitle.status, 200);
      assert.ok(originalSubtitle.text.includes(original));
    }
  });

  it("rejects AVI and keeps the configured 200 MB video limit", async () => {
    const uploaded = await uploadVideo(context.server.baseUrl, context.token, {
      title: `Unsupported ${runId}`,
      filename: "lesson.avi",
      mimeType: "video/x-msvideo",
    });

    assert.equal(uploaded.status, 400);
    assert.equal(uploaded.data.errorCode, "VIDEO_INVALID_TYPE");
    assert.equal(videoUpload.limits.fileSize, 200 * 1024 * 1024);
  });

  it("returns clear errors for silent videos and transcription failures", async () => {
    const silent = await uploadVideo(context.server.baseUrl, context.token, {
      title: `Silent ${runId}`,
      filename: "silent-video.mp4",
    });
    assert.equal(silent.status, 422);
    assert.equal(silent.data.errorCode, "VIDEO_NO_SPEECH");

    const failed = await uploadVideo(context.server.baseUrl, context.token, {
      title: `STT failure ${runId}`,
      filename: "stt-failure.mp4",
    });
    assert.equal(failed.status, 503);
    assert.equal(failed.data.errorCode, "VIDEO_TRANSCRIPTION_FAILED");
  });

  it("retains the lesson and transcript when AI generation fails", async () => {
    const uploaded = await uploadVideo(context.server.baseUrl, context.token, {
      title: `AI failure ${runId}`,
      filename: "ai-failure.mp4",
      features: ["summary"],
    });

    assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
    assert.deepEqual(uploaded.data.failed, ["summary"]);
    const lesson = await getLesson(uploaded.data.lesson.id);
    assert.ok(lesson);
    assert.match(lesson.extracted_text, /AI_FAILURE_TRANSCRIPT/);
    assert.equal(await countGeneratedContent(lesson.id), 0);
  });

  it("keeps successful subtitle languages when one translation fails", async () => {
    const uploaded = await uploadVideo(context.server.baseUrl, context.token, {
      title: `Partial subtitles ${runId}`,
      filename: "translation-failure-ar.mp4",
    });

    assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
    const englishSubtitle = await getLessonSubtitle(context.server.baseUrl, context.token, uploaded.data.lesson.id, "en");
    assert.equal(englishSubtitle.status, 200, `English subtitle response: ${englishSubtitle.text}`);
    assert.equal((await getLessonSubtitle(context.server.baseUrl, context.token, uploaded.data.lesson.id, "ar")).status, 404);
    const kurdishSubtitle = await getLessonSubtitle(context.server.baseUrl, context.token, uploaded.data.lesson.id, "ckb");
    assert.equal(kurdishSubtitle.status, 200, `Kurdish subtitle response: ${kurdishSubtitle.text}`);
    assert.match(uploaded.data.lesson.extracted_text, /FAIL_TRANSLATION_AR/);
  });

  it("builds the existing AI prompts in English, Arabic, and Kurdish", () => {
    const expected = [
      ["en", "Write JSON string values in English"],
      ["ar", "Write JSON string values in Modern Standard Arabic"],
      ["ckb", "Write JSON string values in clear, natural Kurdish (Sorani)"],
    ];
    for (const [language, instruction] of expected) {
      assert.ok(createPrompt("summary", { language, level: "beginner", needs: [] }, "Test transcript").includes(instruction));
    }
  });
});