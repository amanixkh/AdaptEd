const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS) || 30000;

async function generate(prompt) {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: prompt }],
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const body = await response.text();
            const error = new Error(`OpenRouter request failed (${response.status}): ${body}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("OpenRouter returned an empty or malformed response");
        }

        return content;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error(`OpenRouter request timed out after ${TIMEOUT_MS}ms`);
            timeoutError.code = "ETIMEDOUT";
            throw timeoutError;
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { name: "OpenRouter", generate };