const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const { regenerate } = require("../controllers/regenerateController");
const {
    generateAndSaveFeature,
    QuizContentTooShortError,
} = require("../services/contentGenerationService");

// Only these feature names are ever generated/saved; anything else is ignored.
const ALLOWED_FEATURES = ["summary", "quiz", "flashcards"];

const DEFAULT_QUESTION_COUNT = 10;
const MIN_QUESTION_COUNT = 5;
const MAX_QUESTION_COUNT = 15;

// Falls back to the default whenever questionCount is missing or outside the allowed range.
function resolveQuestionCount(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < MIN_QUESTION_COUNT || parsed > MAX_QUESTION_COUNT) {
        return DEFAULT_QUESTION_COUNT;
    }
    return parsed;
}

// Removes duplicates and unsupported names from the requested features list,
// preserving the original order of first occurrence.
function sanitizeFeatures(features) {
    return [...new Set(features)].filter((feature) => ALLOWED_FEATURES.includes(feature));
}

// A lesson can only be generated for by its owner (a teacher or an independent
// student). Answers with 404 when the lesson does not exist or belongs to another
// user, so cross-user generation never loads someone else's content.
async function ensureLessonOwner(req, res, lessonId) {
    const result = await pool.query(
        "SELECT 1 FROM lessons WHERE id = $1 AND user_id = $2",
        [lessonId, req.user.id]
    );

    if (result.rows.length === 0) {
        res.status(404).json({
            success: false,
            message: "Lesson not found",
        });
        return false;
    }

    return true;
}

router.post("/regenerate", authMiddleware, async (req, res) => {
    try {
        const requestedLessonId = Number(req.body?.lessonId);

        // Invalid ids keep falling through to the controller, which returns its
        // existing 400 validation response.
        if (Number.isInteger(requestedLessonId) && requestedLessonId > 0) {
            const owned = await ensureLessonOwner(req, res, requestedLessonId);
            if (!owned) return;
        }

        return regenerate(req, res);
    } catch (error) {
        console.error("Regenerate authorization error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// Single generation API: "features" decides WHAT is generated (one output/row
// per feature). "profile.needs" only changes HOW each feature is written
// (style/adaptation) and never produces its own output type or row.
router.post("/", authMiddleware, async (req, res) => {
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
        const { lessonId, features, profile, questionCount } = req.body;
        const profileWithQuestionCount = { ...(profile || {}), quizCount: resolveQuestionCount(questionCount) };

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

        // 3- Fetch the lesson's extracted text (owned by the authenticated user only)
        const databaseStartedAt = Date.now();
        const lesson = await pool.query(
            "SELECT extracted_text FROM lessons WHERE id = $1 AND user_id = $2",
            [lessonId, req.user.id]
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
        const featureMessages = [];
        const results = [];

        // 4- Generate + persist content, one row per requested feature. A failure
        // on one feature (prompt/AI/DB) is recorded in `failed` and does NOT stop
        // the remaining features from being generated.
        for (const feature of featuresToGenerate) {
            try {
                const result = await generateAndSaveFeature({
                    lessonId,
                    feature,
                    profile: profileWithQuestionCount,
                    text,
                    mode: requestMode,
                });
                generated.push({ type: feature, status: "completed" });
                results.push({
                    type: feature,
                    status: "completed",
                    generatedContentId: result.generatedContentId,
                    content: result.content,
                });
                if (result.message) featureMessages.push(result.message);
            } catch (error) {
                console.error(`[AI] ${feature} failed:`, error.message);
                failed.push(feature);
                failureErrors.push(error);
                results.push({ type: feature, status: "failed", error: error.message });
                if (error instanceof QuizContentTooShortError) featureMessages.push(error.message);
            }
        }

        if (generated.length === 0) {
            const providersUnavailable = failureErrors.every(
                (error) => error.name === "AIProviderError"
            );
            const quizContentTooShort = failureErrors.some(
                (error) => error instanceof QuizContentTooShortError
            );

            return res.status(quizContentTooShort ? 422 : providersUnavailable ? 503 : 500).json({
                success: false,
                message: quizContentTooShort
                    ? failureErrors.find((error) => error instanceof QuizContentTooShortError).message
                    : providersUnavailable
                    ? "AI service is temporarily unavailable. Please try again later."
                    : "Content generation failed.",
                generated,
                failed,
                results,
            });
        }

        return res.status(201).json({
            success: true,
            generated,
            failed,
            results,
            ...(featureMessages.length ? { message: featureMessages.join(" ") } : {}),
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
