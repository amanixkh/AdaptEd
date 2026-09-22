const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 35000;

async function generate(prompt) {
    const ai = require("../../../config/gemini");
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(`Gemini request timed out after ${TIMEOUT_MS}ms`);
            error.code = "ETIMEDOUT";
            reject(error);
        }, TIMEOUT_MS);
    });

    try {
        const response = await Promise.race([
            ai.models.generateContent({ model: MODEL, contents: prompt }),
            timeout,
        ]);

        if (!response?.text) {
            throw new Error("Gemini returned an empty response");
        }

        return response.text;
    } finally {
        clearTimeout(timeoutId);
    }
}

module.exports = { name: "Gemini", generate };