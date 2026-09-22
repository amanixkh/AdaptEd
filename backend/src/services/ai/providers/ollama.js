const BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 60000;

async function generate(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL, prompt, stream: false }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const body = await response.text();
            const error = new Error(`Ollama request failed (${response.status}): ${body}`);
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
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { name: "Ollama", generate };