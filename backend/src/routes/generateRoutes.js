const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const { createPrompt } = require("../utils/promptGenerator");
const { generateAIResponse } = require("../services/aiService");

// Only these feature names are ever generated/saved; anything else is ignored.
const ALLOWED_FEATURES = ["summary", "quiz", "flashcards"];

// Removes duplicates and unsupported names from the requested features list,
// preserving the original order of first occurrence.
function sanitizeFeatures(features) {
    return [...new Set(features)].filter((feature) => ALLOWED_FEATURES.includes(feature));
}

// Generates one feature's content and saves it to generated_content.
// Throws if prompt building, the AI call, or the DB insert fails, so the
// caller can record it as a failed feature without stopping the others.
async function generateAndSaveFeature({ lessonId, feature, profile, text }) {
    console.log(`[AI] Starting ${feature} generation`);

    const prompt = createPrompt(feature, profile, text);
    const aiResult = await generateAIResponse(prompt);
    const content = aiResult.text;

    console.log(`[AI] ${feature} completed`);
    console.log(`[DB] Saving ${feature}`);

    await pool.query(
        `INSERT INTO generated_content (lesson_id, content_type, content)
         VALUES ($1, $2, $3)`,
        [lessonId, feature, content]
    );

    console.log(`[DB] ${feature} saved`);
}

// Single generation API: "features" decides WHAT is generated (one output/row
// per feature). "profile.needs" only changes HOW each feature is written
// (style/adaptation) and never produces its own output type or row.
router.post("/", async (req, res) => {
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
        const lesson = await pool.query(
            "SELECT extracted_text FROM lessons WHERE id = $1",
            [lessonId]
        );

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

        // 4- Generate + persist content, one row per requested feature. A failure
        // on one feature (prompt/AI/DB) is recorded in `failed` and does NOT stop
        // the remaining features from being generated.
        for (const feature of featuresToGenerate) {
            try {
                await generateAndSaveFeature({ lessonId, feature, profile, text });
                generated.push({ type: feature, status: "completed" });
            } catch (error) {
                console.error(`[AI] ${feature} failed:`, error.message);
                failed.push(feature);
            }
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
