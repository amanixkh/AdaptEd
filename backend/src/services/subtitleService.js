const { formatTimestamp } = require("./videoSpeechToTextService");

/**
 * Convert seconds or timestamp string to WebVTT format
 */
function formatVttTimestamp(value) {
  if (typeof value === "string" && value.includes(":")) {
    return `${value}.000`;
  }

  const seconds = Number(value || 0);

  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = (seconds % 60).toFixed(3).padStart(6, "0");

  return `${hours}:${minutes}:${secs}`;
}


/**
 * Convert Whisper segments to WebVTT subtitles
 *
 * Input:
 * [
 *   {
 *     start:"00:00:01",
 *     end:"00:00:05",
 *     text:"Hello students"
 *   }
 * ]
 *
 * Output:
 * WEBVTT
 *
 * 00:00:01.000 --> 00:00:05.000
 * Hello students
 */
function generateWebVtt(segments = []) {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("No transcript segments provided");
  }

  const lines = ["WEBVTT", ""];

  segments.forEach((segment, index) => {
    if (!segment.text) return;

    lines.push(String(index + 1));

    lines.push(
      `${formatVttTimestamp(segment.start)} --> ${formatVttTimestamp(
        segment.end
      )}`
    );

    lines.push(segment.text.trim());

    lines.push("");
  });

  return lines.join("\n");
}


module.exports = {
  generateWebVtt,
  formatVttTimestamp,
};