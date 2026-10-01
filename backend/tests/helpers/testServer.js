// Test-only infrastructure: starts the real backend (server.js) as a child
// process with an OpenAI-compatible stub provider, so generate/tutor tests are
// deterministic and never call a real AI provider.
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const BACKEND_ROOT = path.resolve(__dirname, "..", "..");

// Builds a valid answer for whichever feature the prompt asks for.
function buildStubPayload(prompt) {
  if (prompt.includes("Input: ")) {
    const input = JSON.parse(prompt.match(/Input:\s*([\s\S]*)$/)?.[1] || "[]");
    const language = prompt.includes("Arabic")
      ? "AR"
      : prompt.includes("Kurdish Sorani")
        ? "CKB"
        : "EN";
    return { segments: input.map(({ id, text }) => ({ id, text: `${language}: ${text}` })) };
  }

  const localized = prompt.includes("Modern Standard Arabic")
    ? { summary: "ملخص تجريبي", question: "سؤال تجريبي؟", option: "خيار", answer: "إجابة", explanation: "شرح", front: "مصطلح", back: "تعريف" }
    : prompt.includes("Kurdish (Sorani)")
      ? { summary: "پوختەی تاقیکردنەوە", question: "پرسیاری تاقیکردنەوە؟", option: "هەڵبژاردە", answer: "وەڵام", explanation: "ڕوونکردنەوە", front: "چەمک", back: "پێناسە" }
      : { summary: "Stubbed summary text.", question: "Stubbed question?", option: "Option", answer: "Answer", explanation: "Stubbed explanation.", front: "Stubbed term", back: "Stubbed definition." };

  if (prompt.includes('"notes"')) {
    return { notes: ["Stubbed source note for compaction."] };
  }

  if (prompt.includes('"flashcards"')) {
    return {
      flashcards: [
        { front: localized.front, back: localized.back },
        { front: `${localized.front} 2`, back: localized.back },
      ],
    };
  }

  if (prompt.includes('"quiz"')) {
    const match = prompt.match(/Create exactly (\d+) distinct/);
    const count = match ? Number(match[1]) : 0;
    return {
      quiz: Array.from({ length: count }, (_, index) => ({
        question: `${localized.question} ${index + 1}`,
        options: [`${localized.option} A`, `${localized.option} B`, `${localized.option} C`, `${localized.option} D`],
        answer: `${localized.option} A`,
        explanation: localized.explanation,
      })),
    };
  }

  if (prompt.includes('"simplified"')) {
    return { simplified: "Stubbed simplified lesson text." };
  }

  return { summary: localized.summary };
}

async function startAiStub() {
  const server = http.createServer((req, res) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      let prompt = "";
      try {
        prompt = JSON.parse(raw)?.messages?.[0]?.content || "";
      } catch {
        prompt = "";
      }

      const failsArabicTranslation = String(prompt).includes("FAIL_TRANSLATION_AR") && String(prompt).includes("Arabic");
      const content = String(prompt).includes("AI_FAILURE_TRANSCRIPT") || failsArabicTranslation
        ? "not valid json"
        : JSON.stringify(buildStubPayload(String(prompt)));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}/v1`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// server.js listens on "localhost", which may resolve to ::1 or 127.0.0.1, so the
// probe tries every candidate and keeps the first one that answers.
const HOST_CANDIDATES = ["127.0.0.1", "localhost", "[::1]"];

async function resolveServerUrl(port, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = new Error("timeout");

  while (Date.now() < deadline) {
    for (const host of HOST_CANDIDATES) {
      try {
        const response = await fetch(`http://${host}:${port}/`);
        if (response.ok) return `http://${host}:${port}`;
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Backend did not answer on port ${port}: ${lastError.message}`);
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();

    const killFallback = setTimeout(() => {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    }, 3000);

    child.once("exit", () => {
      clearTimeout(killFallback);
      resolve();
    });

    child.kill();
  });
}

async function startBackend() {
  const stub = await startAiStub();
  const port = await findFreePort();
  const logs = [];

  const child = spawn(
    process.execPath,
    ["--require", path.join(__dirname, "stubOpenRouter.js"), "server.js"],
    {
      cwd: BACKEND_ROOT,
      env: {
        ...process.env,
        PORT: String(port),
        PRIMARY_PROVIDER: "ollama",
        OLLAMA_BASE_URL: stub.url,
        OLLAMA_MODEL: "test-stub",
        OLLAMA_TIMEOUT_MS: "15000",
        TEST_VIDEO_STT_MOCK: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const collect = (data) => {
    logs.push(String(data));
    if (logs.length > 200) logs.shift();
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);

  let baseUrl;
  try {
    baseUrl = await resolveServerUrl(port);
  } catch (error) {
    await stopChild(child);
    await stub.close();
    throw new Error(`${error.message}\n--- backend output ---\n${logs.join("")}`);
  }

  return {
    baseUrl,
    logs,
    stop: async () => {
      await stopChild(child);
      await stub.close();
    },
  };
}

module.exports = { startBackend, BACKEND_ROOT };
