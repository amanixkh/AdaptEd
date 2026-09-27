const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3.1";
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL;
const TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS) || 45000;

function getConfiguredModels() {
    return [MODEL, FALLBACK_MODEL].filter(Boolean);
}

function createUnavailableError(message, status) {
    const error = new Error(message);
    error.code = "OPENROUTER_UNAVAILABLE";
    if (status) error.status = status;
    return error;
}

async function requestModel(model, prompt, options) {
    if (!process.env.OPENROUTER_API_KEY) {
        console.warn("[AI] OpenRouter unavailable (missing/invalid API key)");
        throw createUnavailableError("OPENROUTER_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const body = JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            ...(options.responseFormat === "json" && {
                response_format: { type: "json_object" },
            }),
        });

    try {
            const requestStartedAt = Date.now();
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
                body,
            signal: controller.signal,
        });
            const responseStartedAt = Date.now();
            console.log("[AI] OpenRouter response headers received", {
                model,
                status: response.status,
                requestDurationMs: responseStartedAt - requestStartedAt,
            });

        if (!response.ok) {
            const errorBody = await response.text();
            if (response.status === 401 || response.status === 403) {
                console.warn("[AI] OpenRouter unavailable (missing/invalid API key)");
                throw createUnavailableError("OpenRouter API key is missing or invalid", response.status);
            }
                const error = new Error(`OpenRouter request failed (${response.status}): ${errorBody}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
            console.log("[AI] OpenRouter response parsed", {
                model,
                responseDurationMs: Date.now() - responseStartedAt,
            });
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("OpenRouter returned an empty or malformed response");
        }

        return content;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error(`OpenRouter request timed out after ${TIMEOUT_MS}ms`);
            timeoutError.code = "ETIMEDOUT";
                timeoutError.timeoutSource = "AbortController setTimeout";
            throw timeoutError;
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function generate(prompt, options = {}) {
    const models = getConfiguredModels();
    let lastError;

    for (const model of models) {
        console.log(`[AI] OpenRouter model: ${model}`);
            console.log("[AI] OpenRouter request started", {
                model,
                payloadBytes: Buffer.byteLength(JSON.stringify({
                    model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                    ...(options.responseFormat === "json" && {
                        response_format: { type: "json_object" },
                    }),
                }), "utf8"),
                promptCharacters: prompt.length,
                timeoutMs: TIMEOUT_MS,
                timeoutSource: "AbortController setTimeout",
            });

        try {
            const text = await requestModel(model, prompt, options);
            console.log("[AI] OpenRouter succeeded");
            return text;
        } catch (error) {
            lastError = error;
            console.warn("[AI] OpenRouter failed:", {
                model,
                message: error.message,
                status: error.status,
                code: error.code,
                    timeoutSource: error.timeoutSource,
            });

            if (error.code === "OPENROUTER_UNAVAILABLE") break;
        }
    }

    throw lastError || new Error("OpenRouter is not configured");
}

module.exports = { name: "OpenRouter", generate };