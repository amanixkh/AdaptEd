const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const pool = require("../config/db");

// دالة تنظيف النص مع الحفاظ على الفقرات
function cleanExtractedText(text) {
    const lines = text.split("\n");

    return lines
        .map(line => line.trim())          // حذف المسافات ببداية ونهاية السطر
        .filter(line => line.length > 0)   // حذف الأسطر الفارغة
        .join("\n\n")                      // ترك سطر فارغ بين الفقرات
        .replace(/[ \t]+/g, " ")           // حذف المسافات المكررة
        .replace(/\n{3,}/g, "\n\n")        // عدم السماح بأكثر من سطرين فارغين
        .trim();
}

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

        // تنظيف النص
        const cleanedText = cleanExtractedText(data.text);

        // حفظ البيانات في جدول lessons
        const result = await pool.query(
            `INSERT INTO lessons
            (title, original_name, file_size, file_path, extracted_text)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                req.file.originalname,
                req.file.originalname,
                req.file.size,
                req.file.path,
                cleanedText
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