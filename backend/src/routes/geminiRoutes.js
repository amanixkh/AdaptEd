const express = require("express");
const router = express.Router();

const ai = require("../config/gemini");
const pool = require("../config/db");

// Config for retrying Gemini calls when the AI service is temporarily unavailable
const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_DELAY_MS = 2000;

// Small helper to pause execution between retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Detects whether an error from the Gemini SDK represents a temporary
// "service unavailable / overloaded" condition (HTTP 503) rather than
// an unrelated internal error.
function isGeminiUnavailableError(error) {
    const status = error?.status || error?.code || error?.response?.status;
    const message = (error?.message || "").toLowerCase();

    return (
        status === 503 ||
        status === "UNAVAILABLE" ||
        message.includes("503") ||
        message.includes("unavailable") ||
        message.includes("overloaded")
    );
}

// Wraps ai.models.generateContent with automatic retries when Gemini
// reports it is temporarily unavailable/overloaded. Any other error is
// rethrown immediately so it can be treated as a genuine internal error.
async function generateContentWithRetry(params) {
    let lastError;

    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error) {
            lastError = error;

            if (!isGeminiUnavailableError(error)) {
                // Not a temporary availability issue, fail fast
                throw error;
            }

            // If we still have attempts left, wait before retrying
            if (attempt < GEMINI_MAX_RETRIES) {
                await delay(GEMINI_RETRY_DELAY_MS);
            }
        }
    }

    // All retries exhausted while Gemini remained unavailable
    throw lastError;
}


router.post("/summary/:lessonId", async (req, res) => {
    try {

        const { lessonId } = req.params;


        // 1- Get lesson text from database
        const lesson = await pool.query(
            "SELECT extracted_text FROM lessons WHERE id = $1",
            [lessonId]
        );


        if (lesson.rows.length === 0) {
            return res.status(404).json({
                message: "Lesson not found"
            });
        }


        const text = lesson.rows[0].extracted_text;


        if (!text) {
            return res.status(400).json({
                message: "No extracted text found"
            });
        }


        // 2- Send text to Gemini (retries automatically on temporary unavailability)
        const response = await generateContentWithRetry({
            model: "gemini-3.6-flash",
            contents:
            `Summarize this lesson in simple bullet points:\n\n${text}`
        });


        const summary = response.text;


        // 3- Save result
        await pool.query(
            `
            INSERT INTO generated_content
            (lesson_id, content_type, content)
            VALUES ($1, $2, $3)
            `,
            [
                lessonId,
                "summary",
                summary
            ]
        );


        res.json({
            message: "Summary generated successfully",
            summary
        });


    } catch(error){

        console.error(error);

        // If Gemini stayed unavailable/overloaded after all retries,
        // return 503 with the required response shape instead of 500
        if (isGeminiUnavailableError(error)) {
            return res.status(503).json({
                success: false,
                message: "AI service is temporarily unavailable. Please try again later."
            });
        }

        // Any other unexpected error is a genuine internal server error
        res.status(500).json({
            message:"Gemini Error",
            error:error.message
        });
    }
});


module.exports = router;