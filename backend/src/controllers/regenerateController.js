const { regenerateContent, RegenerationError } = require("../services/regenerateService");
const { isRetryableProviderError } = require("../services/ai/generateService");

async function regenerate(req, res) {
    const { lessonId, mode, features } = req.body || {};
    const requestStartedAt = Date.now();
    res.once("finish", () => {
        console.log("[Regenerate] Request completed", {
            lessonId,
            mode,
            features: Array.isArray(features) ? features : [],
            statusCode: res.statusCode,
            totalMs: Date.now() - requestStartedAt,
        });
    });
    console.log("[Regenerate] Incoming request", {
        lessonId,
        mode,
        features: Array.isArray(features) ? features : [],
    });

    try {
        const result = await regenerateContent({ lessonId, mode, features });

        console.log("[Regenerate] Response sent successfully", {
            lessonId,
            generatedContentIds: result.generatedContentId,
        });

        return res.status(201).json({
            success: true,
            message: "Content regenerated successfully.",
            ...result,
        });
    } catch (error) {
        if (error instanceof RegenerationError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        if (error.name === "AIProviderError" || isRetryableProviderError(error)) {
            console.error("[Regenerate] All AI providers failed:", error.message);
            return res.status(503).json({
                success: false,
                message: "AI service is temporarily unavailable. Please try again later.",
            });
        }

        console.error("[Regenerate] Unexpected error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to regenerate content.",
        });
    }
}

module.exports = { regenerate };