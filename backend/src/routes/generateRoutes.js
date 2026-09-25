const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const { regenerate } = require("../controllers/regenerateController");
const { generateAndSaveFeature } = require("../services/contentGenerationService");

// Only these feature names are ever generated/saved; anything else is ignored.
const ALLOWED_FEATURES = ["summary", "quiz", "flashcards"];

// Removes duplicates and unsupported names from the requested features list,
// preserving the original order of first occurrence.
function sanitizeFeatures(features) {
    return [...new Set(features)].filter((feature) => ALLOWED_FEATURES.includes(feature));
}

router.post("/regenerate", regenerate);

// Single generation API: "features" decides WHAT is generated (one output/row
// per feature). "profile.needs" only changes HOW each feature is written
// (style/adaptation) and never produces its own output type or row.
router.post("/", async (req, res) => {
    const requestStartedAt = Date.now();
    const requestMode = Array.isArray(req.body?.profile?.needs) && req.body.profile.needs.length > 0
        ? req.body.profile.needs.join(", ")
        : "Default";
    res.once("finish", () => {
        console.log("[Generate] Request completed", {
            lessonId: req.body?.lessonId,
            mode: requestMode,
            features: Array.isArray(req.body?.features) ? req.body.features : [],
            statusCode: res.statusCode,
            totalMs: Date.now() - requestStartedAt,
        });
    });

    try {
        const { lessonId, features, profile } = req.body;

        // 1- Validate lessonId
        if (!lessonId || isNaN(Number(lessonId))) {
            return res.status(400).json({
                success: false,
                message: "A valid lessonId is required",
            });
        }

        // 2- Validate requested features
        if (!Array.isArray(features) || features.length === 0) {
            return res.status(400).json({
                success: false,
                message: "features must be a non-empty array",
            });
        }

        // Remove duplicates and any unsupported feature name before generating anything
        const featuresToGenerate = sanitizeFeatures(features);

        if (featuresToGenerate.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid features were provided",
            });
        }

        // 3- Fetch the lesson's extracted text
        const databaseStartedAt = Date.now();
        const lesson = await pool.query(
            "SELECT extracted_text FROM lessons WHERE id = $1",
            [lessonId]
        );
        console.log("[Generate] Lesson lookup completed", {
            lessonId,
            mode: requestMode,
            databaseMs: Date.now() - databaseStartedAt,
        });

        if (lesson.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found",
            });
        }

        const text = lesson.rows[0].extracted_text;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "No extracted text found for this lesson",
            });
        }

        const generated = [];
        const failed = [];
        const failureErrors = [];

        // 4- Generate + persist content, one row per requested feature. A failure
        // on one feature (prompt/AI/DB) is recorded in `failed` and does NOT stop
        // the remaining features from being generated.
        for (const feature of featuresToGenerate) {
            try {
                await generateAndSaveFeature({
                    lessonId,
                    feature,
                    profile,
                    text,
                    mode: requestMode,
                });
                generated.push({ type: feature, status: "completed" });
            } catch (error) {
                console.error(`[AI] ${feature} failed:`, error.message);
                failed.push(feature);
                failureErrors.push(error);
            }
        }

        if (generated.length === 0) {
            const providersUnavailable = failureErrors.every(
                (error) => error.name === "AIProviderError"
            );

            return res.status(providersUnavailable ? 503 : 500).json({
                success: false,
                message: providersUnavailable
                    ? "AI service is temporarily unavailable. Please try again later."
                    : "Content generation failed.",
                generated,
                failed,
            });
        }

        return res.status(201).json({
            success: true,
            generated,
            failed,
        });

    } catch (error) {
        console.error("Generate content error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

module.exports = router;
