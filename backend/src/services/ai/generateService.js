const { getProviderChain } = require("./providerFactory");

function isRetryableProviderError(error) {
    if (!error) return false;

    const retryableCodes = new Set([429, 500, 502, 503, 504]);
    const retryableTerms = [
        "rate limit",
        "timeout",
        "timed out",
        "network",
        "unavailable",
        "overloaded",
        "resource_exhausted",
        "econnreset",
        "econnrefused",
        "enotfound",
        "etimedout",
    ];
    const candidates = [error, error.error, error.response?.data?.error, error.cause]
        .filter(Boolean);

    if (typeof error.message === "string") {
        try {
            const parsed = JSON.parse(error.message);
            candidates.push(parsed?.error || parsed);
        } catch {
            // The plain message is checked below.
        }
    }

    return candidates.some((candidate) => {
        const code = Number(candidate.code ?? candidate.status ?? candidate.statusCode);
        const text = `${candidate.name || ""} ${candidate.message || candidate}`.toLowerCase();
        const containsRetryableStatus = /\b(?:429|500|502|503|504)\b/.test(text);
        return retryableCodes.has(code) || containsRetryableStatus ||
            retryableTerms.some((term) => text.includes(term));
    });
}

async function generate(prompt, options = {}) {
    if (typeof prompt !== "string" || !prompt.trim()) {
        throw new TypeError("A non-empty prompt is required");
    }

    const providers = getProviderChain();
    const failures = [];
    let totalGenerationMs = 0;
    let totalJsonParsingMs = 0;

    for (let index = 0; index < providers.length; index += 1) {
        const provider = providers[index];
        const startedAt = Date.now();
        let generationMs = 0;
        let jsonParsingMs = 0;
        console.log(`[AI] Using ${provider.name}...`);

        try {
            const text = await provider.generate(prompt, options);
            generationMs = Date.now() - startedAt;
            totalGenerationMs += generationMs;

            const parsingStartedAt = Date.now();
            let data;
            try {
                data = options.validate ? options.validate(text) : undefined;
            } finally {
                jsonParsingMs = options.validate ? Date.now() - parsingStartedAt : 0;
            }
            totalJsonParsingMs += jsonParsingMs;

            console.log(`[AI] ${provider.name} succeeded.`, {
                generationMs,
                jsonParsingMs,
                responseCharacters: text.length,
                estimatedResponseTokens: Math.ceil(text.length / 4),
            });
            return options.validate
                ? {
                    text,
                    data,
                    provider: provider.name,
                    timings: { aiGenerationMs: totalGenerationMs, jsonParsingMs: totalJsonParsingMs },
                }
                : {
                    text,
                    provider: provider.name,
                    timings: { aiGenerationMs: totalGenerationMs, jsonParsingMs: totalJsonParsingMs },
                };
        } catch (error) {
            const elapsedMs = Date.now() - startedAt;
            if (generationMs === 0) totalGenerationMs += elapsedMs;
            if (jsonParsingMs > 0) totalJsonParsingMs += jsonParsingMs;
            failures.push({ provider: provider.name, error });
            console.warn(`[AI] ${provider.name} failed after ${elapsedMs}ms.`, {
                message: error.message,
                status: error.status,
                code: error.code,
                generationMs: generationMs || elapsedMs,
                jsonParsingMs,
            });

            const nextProvider = providers[index + 1];
            if (nextProvider) {
                console.log(`[AI] Falling back to ${nextProvider.name}...`);
            }
        }
    }

    const error = new Error("All configured AI providers failed");
    error.name = "AIProviderError";
    error.status = 503;
    error.failures = failures;
    error.cause = failures[0]?.error;
    console.error("[AI] All providers failed.", failures.map(({ provider, error: failure }) => ({
        provider,
        message: failure.message,
        status: failure.status,
        code: failure.code,
    })));
    throw error;
}

module.exports = { generate, isRetryableProviderError };