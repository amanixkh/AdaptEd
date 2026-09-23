const BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 300000;

async function generate(prompt, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL,
                prompt,
                stream: false,
                ...(options.responseFormat === "json" && { format: "json" }),
                options: { temperature: 0.2 },
            }),
            signal: controller.signal,
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

        if (!data?.response) {
            throw new Error("Ollama returned an empty or malformed response");
        }

        return data.response;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error(`Ollama request timed out after ${TIMEOUT_MS}ms`);
            timeoutError.code = "ETIMEDOUT";
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