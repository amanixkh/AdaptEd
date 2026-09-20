const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const pool = require("../config/db");


router.post("/upload", upload.single("pdf"), async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No PDF file uploaded"
            });
        }

        // قراءة ملف PDF
        const dataBuffer = fs.readFileSync(req.file.path);

        // استخراج النص
        const parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();


        // حفظ البيانات في جدول lessons
        const result = await pool.query(
            `INSERT INTO lessons 
            (title, file_path, extracted_text)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                req.file.originalname,
                req.file.path,
                data.text
            ]
        );


        res.status(200).json({
            message: "PDF uploaded and saved successfully",
            lesson: result.rows[0]
        });


    } catch (error) {

        console.error("PDF Error:", error);

        res.status(500).json({
            message: "Error uploading PDF",
            error: error.message
        });
    }
});


module.exports = router;