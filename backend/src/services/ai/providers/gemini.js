const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 35000;
const MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatus(error) {
    return Number(error?.status ?? error?.statusCode ?? error?.code ?? error?.response?.status);
}

function isTransientGeminiError(error) {
    const status = getErrorStatus(error);
    if (RETRYABLE_STATUSES.has(status)) return true;

    const text = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
    return /\b(?:429|500|502|503|504)\b/.test(text) ||
        text.includes("unavailable") ||
        text.includes("overloaded") ||
        text.includes("high demand") ||
        text.includes("resource_exhausted");
}

async function generateOnce(prompt, options) {
    const ai = require("../../../config/gemini");
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(`Gemini request timed out after ${TIMEOUT_MS}ms`);
            error.code = "ETIMEDOUT";
            error.timeoutSource = "Promise.race setTimeout";
            reject(error);
        }, TIMEOUT_MS);
    });

    try {
        const request = { model: MODEL, contents: prompt };
        if (options.responseFormat === "json") {
            request.config = { responseMimeType: "application/json", temperature: 0.2 };
        }
        const payloadBytes = Buffer.byteLength(JSON.stringify(request), "utf8");
        console.log("[AI] Gemini request started", {
            model: MODEL,
            payloadBytes,
            promptCharacters: prompt.length,
            timeoutMs: TIMEOUT_MS,
            timeoutSource: "Promise.race setTimeout",
        });

        const requestStartedAt = Date.now();
        const response = await Promise.race([
            ai.models.generateContent(request),
            timeout,
        ]);
        console.log("[AI] Gemini response received", {
            model: MODEL,
            requestDurationMs: Date.now() - requestStartedAt,
        });

        if (!response?.text) {
            throw new Error("Gemini returned an empty response");
        }

        return response.text;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function generate(prompt, options = {}) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
            return await generateOnce(prompt, options);
        } catch (error) {
            const retryable = isTransientGeminiError(error);
            const canRetry = retryable && attempt < MAX_RETRIES;

            console.warn(`[AI] Gemini returned ${getErrorStatus(error) || error.code || error.name || "error"}`, {
                message: error.message,
                attempt: attempt + 1,
                retryable,
            });

            if (!canRetry) throw error;

            console.log(`[AI] Retrying Gemini (${attempt + 1}/${MAX_RETRIES})...`);
            await sleep(500 * 2 ** attempt);
        }
    }
}

module.exports = { name: "Gemini", generate };