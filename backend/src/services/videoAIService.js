const {
  transcribeVideo,
  joinTranscriptText,
} = require("./videoSpeechToTextService");

const {
  adaptVideoTranscript,
} = require("./ai/videoAdaptationService");


async function processVideoLearning(videoPath, profile = {}) {

  console.log("[VIDEO AI] Starting video processing");


  // 1- Speech To Text
  const segments = await transcribeVideo(
    videoPath,
    profile.language
  );


  console.log("[VIDEO AI] Transcript generated", {
    segments: segments.length,
  });


  // Convert segments to full text
  const transcript = joinTranscriptText(segments);


  // 2- Generate educational content
  const learningContent = await adaptVideoTranscript(
    transcript,
    profile
  );


  console.log("[VIDEO AI] Educational content generated");


  return {
    transcript,
    segments,
    content: learningContent,
  };
}


module.exports = {
  processVideoLearning,
};