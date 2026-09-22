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

async function generate(prompt) {
    if (typeof prompt !== "string" || !prompt.trim()) {
        throw new TypeError("A non-empty prompt is required");
    }

    const providers = getProviderChain();
    const failures = [];

    for (let index = 0; index < providers.length; index += 1) {
        const provider = providers[index];
        console.log(`Using ${provider.name}...`);

        try {
            const text = await provider.generate(prompt);
            console.log(`${provider.name} succeeded.`);
            return { text };
        } catch (error) {
            failures.push({ provider: provider.name, error });
            console.warn(`${provider.name} failed.`, error.message);

            const isPrimaryFailure = index === 0;
            if (isPrimaryFailure && !isRetryableProviderError(error)) {
                throw error;
            }

            const nextProvider = providers[index + 1];
            if (nextProvider) {
                console.log(`Switching to ${nextProvider.name}...`);
            }
        }
    }

    const error = new Error("All configured AI providers failed");
    error.name = "AIProviderError";
    error.status = 503;
    error.failures = failures;
    error.cause = failures[0]?.error;
    throw error;
}

module.exports = { generate, isRetryableProviderError };