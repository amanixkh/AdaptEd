const { generate } = require("./ai/generateService");

const SUBTITLE_LANGUAGES = {
  en: "English",
  ar: "Arabic",
  ckb: "Kurdish Sorani (Central Kurdish)",
};
const MAX_TRANSLATION_BATCH_CHARACTERS = 8000;

function formatVttTimestamp(value) {
  let seconds = Number(value);
  if (typeof value === "string" && value.includes(":")) {
    const match = value.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
    if (!match) throw new Error("Invalid subtitle timestamp");
    seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(`0.${match[4] || 0}`);
  }

  if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Invalid subtitle timestamp");
  const milliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const remainder = milliseconds % 60000;
  const secondsPart = Math.floor(remainder / 1000);
  const millisecondsPart = remainder % 1000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}.${String(millisecondsPart).padStart(3, "0")}`;
}

function generateWebVtt(segments = []) {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("No transcript segments provided");
  }

  const lines = ["WEBVTT", ""];

  segments.forEach((segment, index) => {
    const text = String(segment?.text || "").trim();
    if (!text) throw new Error(`Subtitle segment ${index + 1} is empty`);

    lines.push(String(index + 1));
    lines.push(`${formatVttTimestamp(segment.start)} --> ${formatVttTimestamp(segment.end)}`);
    lines.push(text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/-->/g, "--&gt;"));
    lines.push("");
  });

  return lines.join("\n");
}

function splitTranslationBatches(segments) {
  const batches = [];
  let batch = [];
  let characters = 0;

  for (const segment of segments) {
    const segmentCharacters = String(segment.text || "").length;
    if (batch.length && characters + segmentCharacters > MAX_TRANSLATION_BATCH_CHARACTERS) {
      batches.push(batch);
      batch = [];
      characters = 0;
    }
    batch.push(segment);
    characters += segmentCharacters;
  }

  if (batch.length) batches.push(batch);
  return batches;
}

function extractJsonValue(response) {
  const text = String(response || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidates = [fenced, text].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      const start = candidate.search(/[\[{]/);
      if (start < 0) continue;
      const opening = candidate[start];
      const closing = opening === "{" ? "}" : "]";
      let depth = 0;
      let quoted = false;
      let escaped = false;

      for (let index = start; index < candidate.length; index += 1) {
        const character = candidate[index];
        if (quoted) {
          if (escaped) escaped = false;
          else if (character === "\\") escaped = true;
          else if (character === '"') quoted = false;
          continue;
        }
        if (character === '"') quoted = true;
        else if (character === opening) depth += 1;
        else if (character === closing && --depth === 0) {
          try {
            return JSON.parse(candidate.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error("Subtitle translation returned invalid JSON");
}

function validateTranslation(response, inputSegments) {
  const parsed = extractJsonValue(response);
  const outputSegments = Array.isArray(parsed) ? parsed : parsed?.segments;
  if (!Array.isArray(outputSegments) || outputSegments.length !== inputSegments.length) {
    throw new Error("Subtitle translation did not preserve segment count");
  }

  return outputSegments.map((segment, index) => {
    if (segment?.id !== inputSegments[index].id || typeof segment.text !== "string" || !segment.text.trim()) {
      throw new Error("Subtitle translation changed segment IDs or order");
    }
    return { id: segment.id, text: segment.text.trim() };
  });
}

async function translateSubtitleSegments(segments, language, sourceLanguage, generateTranslation = generate) {
  const targetLanguage = SUBTITLE_LANGUAGES[language];
  if (!targetLanguage) throw new Error("Unsupported subtitle language");
  if (!Array.isArray(segments) || segments.length === 0) throw new Error("No transcript segments to translate");
  if (language === sourceLanguage) return segments.map((segment) => ({ ...segment }));

  const translatedSegments = [];
  let segmentOffset = 0;
  for (const batch of splitTranslationBatches(segments)) {
    const inputSegments = batch.map((segment, index) => ({
      id: segment.id ?? segmentOffset + index + 1,
      text: String(segment.text || "").trim(),
    }));
    segmentOffset += batch.length;
    if (inputSegments.some((segment) => !segment.text)) throw new Error("Transcript contains an empty subtitle segment");

    const prompt = [
      `Translate each input segment to ${targetLanguage}.`,
      "Preserve meaning. Return JSON array only. Preserve every ID and input order. Do not explain, merge, split, or omit segments.",
      `Input: ${JSON.stringify(inputSegments)}`,
    ].join("\n\n");

    let translatedBatch;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const { data } = await generateTranslation(prompt, {
          responseFormat: "json",
          validate: (response) => validateTranslation(response, inputSegments),
        });
        translatedBatch = data;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`[VIDEO SUBTITLES] ${language} batch failed (${attempt + 1}/2): ${error.message}`);
      }
    }

    if (!translatedBatch) {
      throw lastError || new Error("Subtitle translation failed");
    }

    translatedSegments.push(...batch.map((segment, index) => ({
      ...segment,
      text: translatedBatch[index].text,
    })));
  }

  return translatedSegments;
}


module.exports = {
  generateWebVtt,
  formatVttTimestamp,
  translateSubtitleSegments,
  SUBTITLE_LANGUAGES,
};