const pool = require("../config/db");
const { generateAndSaveFeature } = require("./contentGenerationService");
const { normalizeMode, CANONICAL_MODES, MODE_DEFAULT } = require("../utils/modeUtils");

const VALID_FEATURES = new Set(["summary", "quiz", "flashcards", "simplified"]);

class RegenerationError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "RegenerationError";
        this.statusCode = statusCode;
    }
}

function validateRequest({ lessonId, mode, features }) {
    if (!Number.isInteger(Number(lessonId)) || Number(lessonId) <= 0) {
        throw new RegenerationError("A valid lessonId is required", 400);
    }

    // Case/whitespace-insensitive so "Dyslexia", "dyslexia", "ADHD", "adhd" all work.
    const normalizedMode = normalizeMode(mode);
    if (!normalizedMode) {
        throw new RegenerationError(
            `Invalid mode "${mode}". Allowed modes: ${CANONICAL_MODES.join(", ")}`,
            400
        );
    }

    if (!Array.isArray(features) || features.length === 0) {
        throw new RegenerationError("features must be a non-empty array", 400);
    }

    const normalizedFeatures = [...new Set(features.map((feature) =>
        typeof feature === "string" ? feature.toLowerCase() : feature
    ))];
    const invalidFeatures = normalizedFeatures.filter((feature) => !VALID_FEATURES.has(feature));

    if (invalidFeatures.length > 0) {
        throw new RegenerationError(
            `Unsupported features: ${invalidFeatures.join(", ")}`,
            400
        );
    }

    return { normalizedMode, normalizedFeatures };
}

function buildProfile(mode, quizCount) {
    const needs = mode === MODE_DEFAULT ? [] : [mode.toLowerCase()];
    return Number.isInteger(quizCount) ? { needs, quizCount } : { needs };
}

async function regenerateContent({ lessonId, mode, features, quizCount }) {
    const { normalizedMode, normalizedFeatures } = validateRequest({ lessonId, mode, features });
    console.log("[Regenerate] Loading lesson", {
        lessonId: Number(lessonId),
        mode: normalizedMode,
        features: normalizedFeatures,
    });

    const databaseStartedAt = Date.now();
    const lessonResult = await pool.query(
        "SELECT extracted_text FROM lessons WHERE id = $1",
        [Number(lessonId)]
    );
    const databaseMs = Date.now() - databaseStartedAt;

    console.log("[Regenerate] Lesson lookup completed", {
        lessonId: Number(lessonId),
        rows: lessonResult.rows.length,
        databaseMs,
    });

    if (lessonResult.rows.length === 0) {
        throw new RegenerationError("Lesson not found", 404);
    }

    const text = lessonResult.rows[0].extracted_text;
    if (typeof text !== "string" || !text.trim()) {
        throw new RegenerationError("No extracted text found for this lesson", 404);
    }

    console.log("[Regenerate] Lesson loaded", {
        lessonId: Number(lessonId),
        textLength: text.length,
    });

    const profile = buildProfile(normalizedMode, Number(quizCount));
    const generated = [];

    for (const feature of normalizedFeatures) {
        generated.push(await generateAndSaveFeature({
            lessonId: Number(lessonId),
            feature,
            profile,
            text,
            mode: normalizedMode,
        }));
    }

    return {
        generatedContentId: generated.map((item) => item.generatedContentId),
        data: Object.fromEntries(generated.map((item) => [item.feature, item.content])),
    };
}

module.exports = { regenerateContent, RegenerationError };