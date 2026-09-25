const gemini = require("./providers/gemini");
const openrouter = require("./providers/openrouter");
const ollama = require("./providers/ollama");

const PROVIDERS = { gemini, openrouter, ollama };
const FALLBACK_ORDER = ["openrouter", "gemini", "ollama"];

function getProviderChain() {
    const primaryName = (process.env.PRIMARY_PROVIDER || "openrouter").toLowerCase();

    if (!PROVIDERS[primaryName]) {
        throw new Error(`Unsupported PRIMARY_PROVIDER: ${primaryName}`);
    }

    return [
        PROVIDERS[primaryName],
        ...FALLBACK_ORDER
            .filter((providerName) => providerName !== primaryName)
            .map((providerName) => PROVIDERS[providerName]),
    ];
}

module.exports = { getProviderChain };