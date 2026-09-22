const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const { generateAIResponse, isRetryableProviderError } = require("../services/aiService");


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


        // 2- Send text to Gemini, with automatic retry + OpenRouter fallback on
        // temporary unavailability (handled centrally in aiService)
        const aiResult = await generateAIResponse(
            `Summarize this lesson in simple bullet points:\n\n${text}`
        );


        const summary = aiResult.text;


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

        // If Gemini and the OpenRouter fallback both stayed unavailable,
        // return 503 with the required response shape instead of 500
        if (isRetryableProviderError(error)) {
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