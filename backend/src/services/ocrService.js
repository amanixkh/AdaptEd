const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const Tesseract = require("tesseract.js");
const { pdfToPng, VerbosityLevel } = require("pdf-to-png-converter");

const OCR_TEMP_ROOT = path.join(process.cwd(), "uploads", "ocr-temp");

function normalizeLessonLanguage(language) {
  const value = String(language || "").trim().toLowerCase();
  if (["ar", "ara", "arabic", "العربية"].includes(value)) return "ar";
  if (["ckb", "ku", "kur", "kurdish", "sorani", "کوردی"].includes(value)) return "ckb";
  return "en";
}

function getOcrLanguage(language) {
  const normalizedLanguage = normalizeLessonLanguage(language);

  if (normalizedLanguage === "ar") {
    return { primary: "ara+eng", fallback: "eng", normalizedLanguage };
  }

  if (normalizedLanguage === "ckb") {
    return { primary: "kur+ara+eng", fallback: "ara+eng", normalizedLanguage };
  }

  return { primary: "eng", fallback: null, normalizedLanguage };
}

function cleanOcrText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function recognizeImage(imagePath, language) {
  const result = await Tesseract.recognize(imagePath, language, {
    logger: (message) => {
      if (message.status === "recognizing text" && message.progress === 1) {
        console.log("[OCR] Page recognition completed", { imagePath, language });
      }
    },
  });

  return result.data?.text || "";
}

async function recognizeWithFallback(imagePath, languageConfig) {
  try {
    return await recognizeImage(imagePath, languageConfig.primary);
  } catch (error) {
    if (!languageConfig.fallback) throw error;

    console.warn("[OCR] Primary language failed; retrying with fallback", {
      imagePath,
      primary: languageConfig.primary,
      fallback: languageConfig.fallback,
      error: error.message,
    });

    return recognizeImage(imagePath, languageConfig.fallback);
  }
}

async function extractTextWithOcr(pdfPath, language) {
  const startedAt = Date.now();
  const tempDir = path.join(OCR_TEMP_ROOT, `${Date.now()}-${crypto.randomUUID()}`);
  const languageConfig = getOcrLanguage(language);

  console.log("[OCR] Starting scanned PDF fallback", {
    pdfPath,
    selectedLanguage: language,
    normalizedLanguage: languageConfig.normalizedLanguage,
    ocrLanguage: languageConfig.primary,
  });

  try {
    await fs.mkdir(tempDir, { recursive: true });

    const pages = await pdfToPng(pdfPath, {
      outputFolder: tempDir,
      outputFileMaskFunc: (pageNumber) => `page-${String(pageNumber).padStart(4, "0")}.png`,
      viewportScale: 2,
      returnPageContent: false,
      processPagesInParallel: true,
      concurrencyLimit: 2,
      verbosityLevel: VerbosityLevel.ERRORS,
    });

    if (!pages.length) {
      throw new Error("No PDF pages were available for OCR");
    }

    const pageTexts = [];

    for (const page of pages) {
      console.log("[OCR] Recognizing page", {
        pageNumber: page.pageNumber,
        imagePath: page.path,
      });
      pageTexts.push(await recognizeWithFallback(page.path, languageConfig));
    }

    const text = cleanOcrText(pageTexts.join("\n\n"));

    if (!text) {
      throw new Error("OCR completed but did not extract readable text");
    }

    console.log("[OCR] Completed scanned PDF fallback", {
      pages: pages.length,
      characters: text.length,
      durationMs: Date.now() - startedAt,
    });

    return text;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch((error) => {
      console.warn("[OCR] Failed to delete temporary OCR files", {
        tempDir,
        error: error.message,
      });
    });
  }
}

module.exports = {
  extractTextWithOcr,
  getOcrLanguage,
};