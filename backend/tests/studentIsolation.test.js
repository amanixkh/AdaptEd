// Phase 4 - backend isolation tests.
//
// Verifies that an independent student (a student who owns lessons directly,
// without a teacher) can create/read/edit/archive/delete/generate/tutor on their
// OWN lessons only, that no student can reach another user's data, and that
// teacher functionality keeps working.
//
// Run from the backend folder:  npm test
const { after, before, describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { startBackend } = require("./helpers/testServer");
const { loginUser, registerUser, request, uploadLesson } = require("./helpers/apiClient");
const {
  closePool,
  countChatMessages,
  countGeneratedContent,
  countOwnedLessons,
  countLessonsByUser,
  deleteUploadedFiles,
  deleteUsersByEmail,
  getLesson,
  listGeneratedContent,
} = require("./helpers/db");

const PASSWORD = "Isolation#2026";
const runId = `${Date.now()}`;

const ctx = {
  server: null,
  baseUrl: "",
  users: {},
  emails: [],
  lessons: {},
};

function auth(user) {
  return { token: user.token };
}

function api(method, urlPath, options = {}) {
  return request(ctx.baseUrl, method, urlPath, options);
}

function uniqueEmails() {
  return ctx.emails.slice();
}

async function createUser(label, role) {
  const email = `iso-${label}-${runId}@adapted.test`;
  const registered = await registerUser(ctx.baseUrl, {
    name: `ISO ${label}`,
    email,
    password: PASSWORD,
    role,
  });

  assert.equal(registered.status, 201, `register ${label}: ${JSON.stringify(registered.data)}`);
  ctx.emails.push(email);

  return { ...(await loginUser(ctx.baseUrl, email, PASSWORD)), email };
}

async function createLesson(owner, title, text) {
  const response = await uploadLesson(ctx.baseUrl, owner.token, { title, text });

  assert.equal(response.status, 200, `upload "${title}": ${JSON.stringify(response.data)}`);
  assert.ok(response.data?.lesson?.id, `upload "${title}" returned no lesson`);
  assert.ok(
    String(response.data.lesson.extracted_text || "").includes(text.slice(0, 20)),
    `upload "${title}" did not extract the PDF text`
  );

  return response.data.lesson;
}

function lessonIds(payload) {
  return (payload?.lessons || []).map((lesson) => String(lesson.id));
}

before(async () => {
  ctx.server = await startBackend();
  ctx.baseUrl = ctx.server.baseUrl;

  ctx.users.teacher = await createUser("teacher", "teacher");
  ctx.users.studentA = await createUser("student-a", "student");
  ctx.users.studentB = await createUser("student-b", "student");

  const { teacher, studentA, studentB } = ctx.users;

  ctx.lessons.teacher = await createLesson(
    teacher,
    `Teacher lesson ${runId}`,
    "Teacher owned lesson text about the water cycle and evaporation stages."
  );
  ctx.lessons.a = await createLesson(
    studentA,
    `Student A lesson ${runId}`,
    "Student A owned lesson text about photosynthesis in green plants."
  );
  ctx.lessons.b = await createLesson(
    studentB,
    `Student B lesson ${runId}`,
    "Student B owned lesson text about Newton laws of motion and inertia."
  );

  // Student B generates content on its own lesson so cross-user content access
  // (edit/delete) can be tested against a real generated_content row.
  const generated = await api("POST", "/api/generate", {
    ...auth(studentB),
    json: { lessonId: ctx.lessons.b.id, features: ["summary"], profile: { language: "en" } },
  });
  assert.equal(generated.status, 201, `student B generate: ${JSON.stringify(generated.data)}`);
});

after(async () => {
  try {
    await deleteUploadedFiles(uniqueEmails());
  } catch (error) {
    console.error("[cleanup] uploaded files:", error.message);
  }

  try {
    await deleteUsersByEmail(uniqueEmails());
  } catch (error) {
    console.error("[cleanup] users:", error.message);
  }

  await closePool();
  if (ctx.server) await ctx.server.stop();
});

describe("Phase 1 - an independent student manages their own lessons only", () => {
  it("Student A creates a lesson (upload) and lists only their own lessons", async () => {
    const created = await createLesson(
      ctx.users.studentA,
      `Student A second lesson ${runId}`,
      "Student A second lesson text about cell division and mitosis phases."
    );
    ctx.lessons.aExtra = created;

    assert.equal(Number(created.user_id), Number(ctx.users.studentA.user.id));

    const list = await api("GET", "/api/lessons", auth(ctx.users.studentA));
    assert.equal(list.status, 200, JSON.stringify(list.data));

    const ids = lessonIds(list.data);
    assert.ok(ids.includes(String(ctx.lessons.a.id)), "own lesson is missing from the list");
    assert.ok(ids.includes(String(created.id)), "the newly created lesson is missing from the list");
    assert.ok(!ids.includes(String(ctx.lessons.b.id)), "Student B's lesson leaked into Student A's list");
    assert.ok(
      !ids.includes(String(ctx.lessons.teacher.id)),
      "the teacher's lesson leaked into Student A's list"
    );

    const owned = await countOwnedLessons(ctx.users.studentA.user.id, ids);
    assert.equal(owned, ids.length, "the list contains lessons Student A does not own");
  });

  it("Student A reads their own lesson with its generated content", async () => {
    const response = await api("GET", `/api/lessons/${ctx.lessons.a.id}`, auth(ctx.users.studentA));

    assert.equal(response.status, 200, JSON.stringify(response.data));
    assert.equal(Number(response.data.lesson.id), Number(ctx.lessons.a.id));
    assert.ok(response.data.lesson.extracted_text.includes("photosynthesis"));
    assert.ok(Array.isArray(response.data.generatedContent));
  });

  it("Student A edits their own lesson", async () => {
    const response = await api("PATCH", `/api/lessons/${ctx.lessons.a.id}`, {
      ...auth(ctx.users.studentA),
      json: { title: `Student A renamed ${runId}` },
    });

    assert.equal(response.status, 200, JSON.stringify(response.data));
    assert.equal(response.data.lesson.title, `Student A renamed ${runId}`);

    const row = await getLesson(ctx.lessons.a.id);
    assert.equal(row.title, `Student A renamed ${runId}`);
    ctx.lessons.a.title = row.title;
  });

  it("Student A generates summary/quiz/flashcards on their own lesson (ADHD + Dyslexia profile)", async () => {
    const response = await api("POST", "/api/generate", {
      ...auth(ctx.users.studentA),
      json: {
        lessonId: ctx.lessons.a.id,
        features: ["summary", "quiz", "flashcards"],
        profile: { language: "en", level: "beginner", needs: ["adhd", "dyslexia"] },
        questionCount: 5,
      },
    });

    assert.equal(response.status, 201, JSON.stringify(response.data));
    assert.deepEqual(
      response.data.generated.map((item) => item.type).sort(),
      ["flashcards", "quiz", "summary"]
    );
    assert.deepEqual(response.data.failed, []);
    assert.deepEqual(
      response.data.results.map((item) => item.type).sort(),
      ["flashcards", "quiz", "summary"]
    );
    assert.equal(typeof response.data.results.find((item) => item.type === "summary").content, "string");
    assert.equal(response.data.results.find((item) => item.type === "quiz").content.length, 5);
    assert.ok(Array.isArray(response.data.results.find((item) => item.type === "flashcards").content));

    const rows = await listGeneratedContent(ctx.lessons.a.id);
    const quiz = rows.find((row) => row.content_type === "quiz");
    assert.ok(quiz, "quiz content was not stored for Student A's lesson");
    assert.equal(JSON.parse(quiz.content).quiz.length, 5);
    assert.equal(rows.filter((row) => row.content_type === "summary").length, 1);
    assert.equal(rows.filter((row) => row.content_type === "flashcards").length, 1);
  });

  it("generates only the supported number of quiz questions when content is limited", async () => {
    const lesson = await createLesson(
      ctx.users.studentA,
      `Student A limited quiz ${runId}`,
      "QUIZ_CAPACITY_7 This lesson explains a small set of connected science concepts."
    );
    ctx.lessons.limitedQuiz = lesson;

    const response = await api("POST", "/api/generate", {
      ...auth(ctx.users.studentA),
      json: { lessonId: lesson.id, features: ["quiz"], questionCount: 10 },
    });

    assert.equal(response.status, 201, JSON.stringify(response.data));
    assert.match(response.data.message, /Only 7 high-quality questions were generated/);
    const quizRow = (await listGeneratedContent(lesson.id)).find((row) => row.content_type === "quiz");
    assert.ok(quizRow, "supported quiz content was not stored");
    assert.equal(JSON.parse(quizRow.content).quiz.length, 7);
  });

  it("does not generate a quiz when fewer than five questions are supported", async () => {
    const lesson = await createLesson(
      ctx.users.studentA,
      `Student A short quiz ${runId}`,
      "QUIZ_CAPACITY_4 This lesson contains only a few facts."
    );
    ctx.lessons.shortQuiz = lesson;

    const response = await api("POST", "/api/generate", {
      ...auth(ctx.users.studentA),
      json: { lessonId: lesson.id, features: ["summary", "quiz", "flashcards"], questionCount: 10 },
    });

    assert.equal(response.status, 201, JSON.stringify(response.data));
    assert.match(response.data.message, /too short to generate a reliable quiz/);
    assert.deepEqual(response.data.failed, ["quiz"]);
    assert.deepEqual(
      response.data.results.map((item) => [item.type, item.status]),
      [["summary", "completed"], ["quiz", "failed"], ["flashcards", "completed"]]
    );
    const rows = await listGeneratedContent(lesson.id);
    assert.deepEqual(rows.map((row) => row.content_type).sort(), ["flashcards", "summary"]);
  });

  it("Student A regenerates simplified content with the Dyslexia mode on their own lesson", async () => {
    const response = await api("POST", "/api/generate/regenerate", {
      ...auth(ctx.users.studentA),
      json: { lessonId: ctx.lessons.a.id, mode: "Dyslexia", features: ["simplified"] },
    });

    assert.equal(response.status, 201, JSON.stringify(response.data));

    const rows = await listGeneratedContent(ctx.lessons.a.id);
    assert.ok(
      rows.some((row) => row.content_type === "simplified"),
      "simplified content was not stored for Student A's lesson"
    );
  });

  it("Student A uses the AI tutor on their own lesson", async () => {
    const before = await countChatMessages(ctx.lessons.a.id);

    const response = await api("POST", "/api/chat", {
      ...auth(ctx.users.studentA),
      json: { lessonId: ctx.lessons.a.id, message: "Explain the main idea of this lesson." },
    });

    assert.equal(response.status, 200, JSON.stringify(response.data));
    assert.equal(typeof response.data.reply, "string");
    assert.ok(response.data.reply.length > 0);

    const after = await countChatMessages(ctx.lessons.a.id);
    assert.equal(after, before + 2, "the tutor exchange was not stored for the student");

    const history = await api(
      "GET",
      `/api/chat/history/${ctx.lessons.a.id}`,
      auth(ctx.users.studentA)
    );
    assert.equal(history.status, 200);
    assert.equal(history.data.messages.length, 2);
  });

  it("Student A uses the quiz on their own lesson (student + lesson endpoints)", async () => {
    const ownLesson = await api(
      "GET",
      `/api/student/lessons/${ctx.lessons.a.id}`,
      auth(ctx.users.studentA)
    );
    assert.equal(ownLesson.status, 200, JSON.stringify(ownLesson.data));
    assert.ok(Array.isArray(ownLesson.data.generatedContent));

    const list = await api("GET", "/api/student/lessons", auth(ctx.users.studentA));
    assert.equal(list.status, 200, JSON.stringify(list.data));
    const ids = lessonIds(list.data);
    assert.ok(ids.includes(String(ctx.lessons.a.id)), "the student's own lesson is missing");
    assert.ok(!ids.includes(String(ctx.lessons.b.id)), "another student's lesson leaked");
    assert.ok(!ids.includes(String(ctx.lessons.teacher.id)), "the teacher's lesson leaked");

    const first = await api("POST", `/api/student/lessons/${ctx.lessons.a.id}/quiz-attempts`, {
      ...auth(ctx.users.studentA),
      json: { score: 2, total: 5 },
    });
    assert.equal(first.status, 201, JSON.stringify(first.data));
    assert.equal(first.data.attempt.percentage, 40);

    const ownAttempts = await api(
      "GET",
      `/api/student/lessons/${ctx.lessons.a.id}/quiz-attempts`,
      auth(ctx.users.studentA)
    );
    assert.equal(ownAttempts.status, 200, JSON.stringify(ownAttempts.data));
    assert.equal(ownAttempts.data.attempts.length, 1);
    assert.equal(ownAttempts.data.canRetake, true);

    const second = await api("POST", `/api/student/lessons/${ctx.lessons.a.id}/quiz-attempts`, {
      ...auth(ctx.users.studentA),
      json: { score: 4, total: 5 },
    });
    assert.equal(second.status, 201, JSON.stringify(second.data));

    const alreadyPassed = await api("POST", `/api/student/lessons/${ctx.lessons.a.id}/quiz-attempts`, {
      ...auth(ctx.users.studentA),
      json: { score: 5, total: 5 },
    });
    assert.equal(alreadyPassed.status, 409, JSON.stringify(alreadyPassed.data));

    const lessonAttempts = await api(
      "GET",
      `/api/lessons/${ctx.lessons.a.id}/quiz-attempts`,
      auth(ctx.users.studentA)
    );
    assert.equal(lessonAttempts.status, 200, JSON.stringify(lessonAttempts.data));
    assert.equal(lessonAttempts.data.attempts.length, 2);

    const foreignAttempt = await api("POST", `/api/student/lessons/${ctx.lessons.b.id}/quiz-attempts`, {
      ...auth(ctx.users.studentA),
      json: { score: 1, total: 5 },
    });
    assert.equal(foreignAttempt.status, 404, JSON.stringify(foreignAttempt.data));
  });

  it("Student A archives, lists, restores and permanently deletes their own lesson", async () => {
    const target = ctx.lessons.aExtra;

    const archived = await api("DELETE", `/api/lessons/${target.id}`, auth(ctx.users.studentA));
    assert.equal(archived.status, 200, JSON.stringify(archived.data));

    const hidden = await api("GET", `/api/lessons/${target.id}`, auth(ctx.users.studentA));
    assert.equal(hidden.status, 404);

    const archivedList = await api("GET", "/api/lessons/archived/list", auth(ctx.users.studentA));
    assert.equal(archivedList.status, 200);
    const archivedIds = lessonIds(archivedList.data);
    assert.ok(
      archivedIds.includes(String(target.id)),
      "the archived lesson is missing from the student's archive list"
    );
    assert.ok(!archivedIds.includes(String(ctx.lessons.b.id)));

    const restored = await api(
      "PATCH",
      `/api/lessons/${target.id}/restore`,
      auth(ctx.users.studentA)
    );
    assert.equal(restored.status, 200, JSON.stringify(restored.data));

    const visibleAgain = await api("GET", `/api/lessons/${target.id}`, auth(ctx.users.studentA));
    assert.equal(visibleAgain.status, 200);

    // A lesson must be archived before it can be permanently removed.
    const tooEarly = await api(
      "DELETE",
      `/api/lessons/${target.id}/permanent`,
      auth(ctx.users.studentA)
    );
    assert.equal(tooEarly.status, 404);

    await api("DELETE", `/api/lessons/${target.id}`, auth(ctx.users.studentA));
    const permanent = await api(
      "DELETE",
      `/api/lessons/${target.id}/permanent`,
      auth(ctx.users.studentA)
    );
    assert.equal(permanent.status, 200, JSON.stringify(permanent.data));
    assert.equal(await getLesson(target.id), null, "the lesson was not permanently deleted");
  });
});

describe("Phase 4 - Student A can never reach Student B's data", () => {
  it("cannot read Student B's lesson", async () => {
    const response = await api("GET", `/api/lessons/${ctx.lessons.b.id}`, auth(ctx.users.studentA));

    assert.equal(response.status, 404, JSON.stringify(response.data));
    assert.equal(response.data.lesson, undefined);
    assert.ok(
      !JSON.stringify(response.data).includes("Newton laws of motion"),
      "Student B's lesson text leaked in the response"
    );
  });

  it("cannot edit Student B's lesson", async () => {
    const before = await getLesson(ctx.lessons.b.id);

    const response = await api("PATCH", `/api/lessons/${ctx.lessons.b.id}`, {
      ...auth(ctx.users.studentA),
      json: { title: "hacked by student A", extractedText: "overwritten by student A" },
    });

    assert.equal(response.status, 404, JSON.stringify(response.data));

    const after = await getLesson(ctx.lessons.b.id);
    assert.equal(after.title, before.title);
    assert.equal(after.extracted_text, before.extracted_text);
  });

  it("cannot archive or restore Student B's lesson", async () => {
    const archive = await api("DELETE", `/api/lessons/${ctx.lessons.b.id}`, auth(ctx.users.studentA));
    assert.equal(archive.status, 404, JSON.stringify(archive.data));

    const restore = await api(
      "PATCH",
      `/api/lessons/${ctx.lessons.b.id}/restore`,
      auth(ctx.users.studentA)
    );
    assert.equal(restore.status, 404, JSON.stringify(restore.data));

    const row = await getLesson(ctx.lessons.b.id);
    assert.equal(row.archived_at, null, "Student B's lesson was archived by another user");
  });

  it("cannot see, restore or permanently delete Student B's archived lesson", async () => {
    const bArchived = await api("DELETE", `/api/lessons/${ctx.lessons.b.id}`, auth(ctx.users.studentB));
    assert.equal(bArchived.status, 200, JSON.stringify(bArchived.data));

    const aArchiveList = await api("GET", "/api/lessons/archived/list", auth(ctx.users.studentA));
    assert.equal(aArchiveList.status, 200);
    assert.ok(
      !lessonIds(aArchiveList.data).includes(String(ctx.lessons.b.id)),
      "Student B's archived lesson leaked into Student A's archive list"
    );

    const restore = await api(
      "PATCH",
      `/api/lessons/${ctx.lessons.b.id}/restore`,
      auth(ctx.users.studentA)
    );
    assert.equal(restore.status, 404, JSON.stringify(restore.data));

    const permanent = await api(
      "DELETE",
      `/api/lessons/${ctx.lessons.b.id}/permanent`,
      auth(ctx.users.studentA)
    );
    assert.equal(permanent.status, 404, JSON.stringify(permanent.data));

    const row = await getLesson(ctx.lessons.b.id);
    assert.ok(row, "Student B's lesson was permanently deleted by another user");
    assert.ok(row.archived_at !== null, "Student B's lesson state was changed");

    // Restore Student B's lesson so later tests start from the original state.
    const bRestore = await api(
      "PATCH",
      `/api/lessons/${ctx.lessons.b.id}/restore`,
      auth(ctx.users.studentB)
    );
    assert.equal(bRestore.status, 200, JSON.stringify(bRestore.data));
  });

  it("cannot generate content on Student B's lesson", async () => {
    const before = await countGeneratedContent(ctx.lessons.b.id);

    const response = await api("POST", "/api/generate", {
      ...auth(ctx.users.studentA),
      json: { lessonId: ctx.lessons.b.id, features: ["summary"], profile: { language: "en" } },
    });

    assert.equal(response.status, 404, JSON.stringify(response.data));
    assert.equal(
      await countGeneratedContent(ctx.lessons.b.id),
      before,
      "content was generated on another student's lesson"
    );
  });

  it("cannot regenerate content on Student B's lesson", async () => {
    const before = await countGeneratedContent(ctx.lessons.b.id);

    const response = await api("POST", "/api/generate/regenerate", {
      ...auth(ctx.users.studentA),
      json: { lessonId: ctx.lessons.b.id, mode: "Default", features: ["summary"] },
    });

    assert.equal(response.status, 404, JSON.stringify(response.data));
    assert.equal(
      await countGeneratedContent(ctx.lessons.b.id),
      before,
      "content was regenerated on another student's lesson"
    );
  });

  it("cannot use the AI tutor on Student B's lesson", async () => {
    const before = await countChatMessages(ctx.lessons.b.id);

    const response = await api("POST", "/api/chat", {
      ...auth(ctx.users.studentA),
      json: { lessonId: ctx.lessons.b.id, message: "Summarize this lesson for me." },
    });

    assert.equal(response.status, 404, JSON.stringify(response.data));
    assert.equal(
      await countChatMessages(ctx.lessons.b.id),
      before,
      "the tutor read another student's lesson"
    );
  });

  it("cannot summarize Student B's lesson through the legacy gemini route", async () => {
    const before = await countGeneratedContent(ctx.lessons.b.id);

    const response = await api("POST", `/api/gemini/summary/${ctx.lessons.b.id}`, {
      ...auth(ctx.users.studentA),
    });

    assert.equal(response.status, 404, JSON.stringify(response.data));
    assert.equal(await countGeneratedContent(ctx.lessons.b.id), before);
  });

  it("cannot edit or delete Student B's generated content", async () => {
    const bContent = await listGeneratedContent(ctx.lessons.b.id);
    assert.ok(bContent.length > 0, "Student B has no generated content fixture");

    const updated = await api("PUT", `/api/generated-content/${bContent[0].id}`, {
      ...auth(ctx.users.studentA),
      json: { content: "hacked by student A" },
    });
    assert.equal(updated.status, 404, JSON.stringify(updated.data));

    const removed = await api("DELETE", `/api/generated-content/${bContent[0].id}`, {
      ...auth(ctx.users.studentA),
    });
    assert.equal(removed.status, 404, JSON.stringify(removed.data));

    const after = await listGeneratedContent(ctx.lessons.b.id);
    assert.equal(after.length, bContent.length);
    assert.equal(after[0].content, bContent[0].content);
  });

  it("cannot use teacher-only lesson endpoints", async () => {
    const students = await api("GET", "/api/lessons/students", auth(ctx.users.studentA));
    assert.equal(students.status, 403, JSON.stringify(students.data));

    const share = await api("POST", `/api/lessons/${ctx.lessons.a.id}/share`, {
      ...auth(ctx.users.studentA),
      json: { studentIds: [ctx.users.studentB.user.id] },
    });
    assert.equal(share.status, 403, JSON.stringify(share.data));

    const attempts = await api(
      "GET",
      `/api/lessons/${ctx.lessons.teacher.id}/quiz-attempts`,
      auth(ctx.users.studentA)
    );
    assert.equal(attempts.status, 404, JSON.stringify(attempts.data));

    // The blocked share request must not have created an assignment.
    const bLessons = await api("GET", "/api/student/lessons", auth(ctx.users.studentB));
    assert.equal(bLessons.status, 200);
    assert.ok(
      !lessonIds(bLessons.data).includes(String(ctx.lessons.a.id)),
      "a student managed to share a lesson"
    );
  });

  it("cannot reach the teacher's lesson", async () => {
    const teacherLessonId = ctx.lessons.teacher.id;

    const read = await api("GET", `/api/lessons/${teacherLessonId}`, auth(ctx.users.studentA));
    assert.equal(read.status, 404);

    const edited = await api("PATCH", `/api/lessons/${teacherLessonId}`, {
      ...auth(ctx.users.studentA),
      json: { title: "hacked by student A" },
    });
    assert.equal(edited.status, 404);

    const generate = await api("POST", "/api/generate", {
      ...auth(ctx.users.studentA),
      json: { lessonId: teacherLessonId, features: ["summary"], profile: { language: "en" } },
    });
    assert.equal(generate.status, 404);

    const tutor = await api("POST", "/api/chat", {
      ...auth(ctx.users.studentA),
      json: { lessonId: teacherLessonId, message: "Summarize this lesson." },
    });
    assert.equal(tutor.status, 404);

    const row = await getLesson(teacherLessonId);
    assert.ok(row.title.includes("Teacher lesson"), "the teacher's lesson was modified");
  });
});

describe("Phase 4 - every lesson/generate/tutor route requires a token", () => {
  it("rejects anonymous calls and changes nothing", async () => {
    const calls = [
      ["GET", "/api/lessons"],
      ["GET", `/api/lessons/${ctx.lessons.a.id}`],
      ["PATCH", `/api/lessons/${ctx.lessons.a.id}`],
      ["DELETE", `/api/lessons/${ctx.lessons.a.id}`],
      ["DELETE", `/api/lessons/${ctx.lessons.a.id}/permanent`],
      ["GET", "/api/lessons/archived/list"],
      ["GET", "/api/lessons/students"],
      ["POST", `/api/lessons/${ctx.lessons.a.id}/share`],
      ["POST", "/api/generate"],
      ["POST", "/api/generate/regenerate"],
      ["POST", "/api/chat"],
      ["POST", `/api/gemini/summary/${ctx.lessons.a.id}`],
    ];

    for (const [method, urlPath] of calls) {
      // GET requests cannot carry a body, so only POST/PATCH/DELETE send one.
      const options = method === "GET" ? {} : { json: {} };
      const response = await api(method, urlPath, options);
      assert.equal(response.status, 401, `${method} ${urlPath} should require a token`);
    }

    const row = await getLesson(ctx.lessons.a.id);
    assert.ok(row, "the lesson was deleted by an anonymous request");
    assert.equal(row.archived_at, null, "the lesson was archived by an anonymous request");
  });
});

describe("Teacher regression - existing teacher flows still work", () => {
  it("teacher manages their own lessons (list, read, edit, archive, restore, generate)", async () => {
    const teacher = ctx.users.teacher;

    const list = await api("GET", "/api/lessons", auth(teacher));
    assert.equal(list.status, 200);
    const ids = lessonIds(list.data);
    assert.ok(ids.includes(String(ctx.lessons.teacher.id)));
    assert.ok(!ids.includes(String(ctx.lessons.a.id)), "a student's lesson leaked into the teacher list");

    const read = await api("GET", `/api/lessons/${ctx.lessons.teacher.id}`, auth(teacher));
    assert.equal(read.status, 200);
    assert.ok(read.data.lesson.extracted_text.includes("water cycle"));

    const edited = await api("PATCH", `/api/lessons/${ctx.lessons.teacher.id}`, {
      ...auth(teacher),
      json: { title: `Teacher lesson renamed ${runId}` },
    });
    assert.equal(edited.status, 200, JSON.stringify(edited.data));
    assert.equal(edited.data.lesson.title, `Teacher lesson renamed ${runId}`);

    const generated = await api("POST", "/api/generate", {
      ...auth(teacher),
      json: {
        lessonId: ctx.lessons.teacher.id,
        features: ["summary", "quiz"],
        profile: { language: "en", level: "intermediate", needs: [] },
        questionCount: 5,
      },
    });
    assert.equal(generated.status, 201, JSON.stringify(generated.data));
    assert.deepEqual(generated.data.failed, []);

    const tutor = await api("POST", "/api/chat", {
      ...auth(teacher),
      json: { lessonId: ctx.lessons.teacher.id, message: "Give me a teaching idea." },
    });
    assert.equal(tutor.status, 200, JSON.stringify(tutor.data));

    const trash = await createLesson(
      teacher,
      `Teacher trash lesson ${runId}`,
      "Teacher trash lesson text used to verify the archive flow."
    );

    assert.equal(
      (await api("DELETE", `/api/lessons/${trash.id}`, auth(teacher))).status,
      200
    );

    const archivedList = await api("GET", "/api/lessons/archived/list", auth(teacher));
    assert.equal(archivedList.status, 200);
    assert.ok(lessonIds(archivedList.data).includes(String(trash.id)));

    assert.equal(
      (await api("PATCH", `/api/lessons/${trash.id}/restore`, auth(teacher))).status,
      200
    );
    assert.equal((await api("DELETE", `/api/lessons/${trash.id}`, auth(teacher))).status, 200);
    assert.equal(
      (await api("DELETE", `/api/lessons/${trash.id}/permanent`, auth(teacher))).status,
      200
    );
    assert.equal(await getLesson(trash.id), null);
  });

  it("teacher cannot touch a student's lesson", async () => {
    const teacher = ctx.users.teacher;
    const target = ctx.lessons.a;

    const read = await api("GET", `/api/lessons/${target.id}`, auth(teacher));
    assert.equal(read.status, 404);

    const edited = await api("PATCH", `/api/lessons/${target.id}`, {
      ...auth(teacher),
      json: { title: "hacked by the teacher" },
    });
    assert.equal(edited.status, 404);

    const generated = await api("POST", "/api/generate", {
      ...auth(teacher),
      json: { lessonId: target.id, features: ["summary"], profile: { language: "en" } },
    });
    assert.equal(generated.status, 404);

    const tutor = await api("POST", "/api/chat", {
      ...auth(teacher),
      json: { lessonId: target.id, message: "Summarize this lesson." },
    });
    assert.equal(tutor.status, 404);

    const row = await getLesson(target.id);
    assert.equal(row.title, ctx.lessons.a.title, "the student's lesson was modified");
  });

  it("teacher keeps sharing, and assigned students keep learning (tutor + quiz attempts)", async () => {
    const { teacher, studentA, studentB } = ctx.users;

    const students = await api("GET", "/api/lessons/students", auth(teacher));
    assert.equal(students.status, 200, JSON.stringify(students.data));
    const studentEmails = students.data.students.map((student) => student.email);
    assert.ok(studentEmails.includes(studentA.email));
    assert.ok(studentEmails.includes(studentB.email));

    const share = await api("POST", `/api/lessons/${ctx.lessons.teacher.id}/share`, {
      ...auth(teacher),
      json: { studentIds: [studentA.user.id, studentB.user.id] },
    });
    assert.equal(share.status, 200, JSON.stringify(share.data));

    const aLessons = await api("GET", "/api/student/lessons", auth(studentA));
    assert.equal(aLessons.status, 200, JSON.stringify(aLessons.data));
    assert.ok(
      lessonIds(aLessons.data).includes(String(ctx.lessons.teacher.id)),
      "the shared lesson is missing from the student's list"
    );

    const aLesson = await api(
      "GET",
      `/api/student/lessons/${ctx.lessons.teacher.id}`,
      auth(studentA)
    );
    assert.equal(aLesson.status, 200, JSON.stringify(aLesson.data));
    assert.ok(aLesson.data.lesson.extracted_text.includes("water cycle"));

    // The tutor must still work for a student on a lesson assigned by a teacher.
    const aTutor = await api("POST", "/api/chat", {
      ...auth(studentA),
      json: { lessonId: ctx.lessons.teacher.id, message: "What should I review first?" },
    });
    assert.equal(aTutor.status, 200, JSON.stringify(aTutor.data));

    const bTutor = await api("POST", "/api/chat", {
      ...auth(studentB),
      json: { lessonId: ctx.lessons.teacher.id, message: "Explain evaporation." },
    });
    assert.equal(bTutor.status, 200, JSON.stringify(bTutor.data));

    const attempt = await api("POST", `/api/student/lessons/${ctx.lessons.teacher.id}/quiz-attempts`, {
      ...auth(studentA),
      json: { score: 4, total: 5 },
    });
    assert.equal(attempt.status, 201, JSON.stringify(attempt.data));

    const attempts = await api(
      "GET",
      `/api/lessons/${ctx.lessons.teacher.id}/quiz-attempts`,
      auth(teacher)
    );
    assert.equal(attempts.status, 200, JSON.stringify(attempts.data));
    assert.ok(
      attempts.data.attempts.some((row) => row.studentEmail === studentA.email),
      "the teacher cannot see the student's quiz attempts"
    );
  });

  it("student dashboard/history stay scoped to the student's own lessons", async () => {
    const studentA = ctx.users.studentA;

    const stats = await api("GET", "/api/dashboard/stats", auth(studentA));
    assert.equal(stats.status, 200, JSON.stringify(stats.data));
    assert.equal(stats.data.stats.totalLessons, await countLessonsByUser(studentA.user.id));

    const history = await api("GET", "/api/history", auth(studentA));
    assert.equal(history.status, 200, JSON.stringify(history.data));

    const ids = (history.data.history || []).map((row) => String(row.id));
    assert.ok(ids.includes(String(ctx.lessons.a.id)));
    assert.ok(!ids.includes(String(ctx.lessons.b.id)), "Student B's lesson leaked into Student A's history");
    assert.equal(
      await countOwnedLessons(studentA.user.id, ids),
      ids.length,
      "history returned lessons the student does not own"
    );
  });
});

