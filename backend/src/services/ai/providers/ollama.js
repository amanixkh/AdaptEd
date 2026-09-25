const BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1").replace(/\/$/, "");
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 300000;

async function generate(prompt, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const body = JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        ...(options.responseFormat === "json" && {
            response_format: { type: "json_object" },
        }),
    });
    const payloadBytes = Buffer.byteLength(body, "utf8");

    try {
        console.log("[AI] Ollama request started", {
            model: MODEL,
            payloadBytes,
            promptCharacters: prompt.length,
            timeoutMs: TIMEOUT_MS,
            timeoutSource: "AbortController setTimeout",
        });
        const requestStartedAt = Date.now();
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            signal: controller.signal,
        });
        const responseStartedAt = Date.now();
        console.log("[AI] Ollama response headers received", {
            model: MODEL,
            status: response.status,
            requestDurationMs: responseStartedAt - requestStartedAt,
        });

        if (!response.ok) {
            const body = await response.text();
            const modelHint = response.status === 404
                ? ` Check that model "${MODEL}" is installed with: ollama pull ${MODEL}.`
                : "";
            const error = new Error(
                `Ollama request failed (${response.status}): ${body}.${modelHint}`
            );
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        console.log("[AI] Ollama response parsed", {
            model: MODEL,
            responseDurationMs: Date.now() - responseStartedAt,
        });

        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("Ollama returned an empty or malformed response");
        }

        return content;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error(`Ollama request timed out after ${TIMEOUT_MS}ms`);
            timeoutError.code = "ETIMEDOUT";
            timeoutError.timeoutSource = "AbortController setTimeout";
            throw timeoutError;
        }
        if (error instanceof TypeError) {
            const connectionError = new Error(`Unable to connect to Ollama at ${BASE_URL}: ${error.message}`);
            connectionError.code = error.cause?.code || "OLLAMA_CONNECTION_ERROR";
            connectionError.cause = error;
            throw connectionError;
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { name: "Ollama", generate };