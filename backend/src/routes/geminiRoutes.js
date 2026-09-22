const express = require("express");
const router = express.Router();

const ai = require("../config/gemini");
const pool = require("../config/db");

const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_DELAY_MS = 2000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function generateContentWithRetry(params) {
    let lastError;

    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error) {
            lastError = error;

            if (!isGeminiUnavailableError(error)) {
                throw error;
            }

            if (attempt < GEMINI_MAX_RETRIES) {
                await delay(GEMINI_RETRY_DELAY_MS);
            }
        }
    }

    throw lastError;
}


router.post("/summary/:lessonId", async (req, res) => {
    try {

        const { lessonId } = req.params;


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


        const response = await generateContentWithRetry({
            model: "gemini-3.6-flash",
            contents:
            `Summarize this lesson in simple bullet points:\n\n${text}`
        });


        const summary = response.text;


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

        if (isGeminiUnavailableError(error)) {
            return res.status(503).json({
                success: false,
                message: "AI service is temporarily unavailable. Please try again later."
            });
        }

        res.status(500).json({
            message:"Gemini Error",
            error:error.message
        });
    }
});


module.exports = router;