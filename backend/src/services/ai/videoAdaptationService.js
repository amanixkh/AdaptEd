const { generate } = require("./generateService");


function buildVideoAdaptationPrompt(transcript, profile = {}) {
  const {
    language = "English",
    level = "beginner",
    need = "general",
  } = profile;


  return `
You are an AI educational assistant inside AdaptEd.

Your task is to transform a video transcript into accessible learning materials.

Rules:
- Use ONLY information from the transcript.
- Do not invent facts.
- Keep explanations suitable for students.
- Adapt the content based on student's needs.

Student profile:
Language: ${language}
Level: ${level}
Learning need: ${need}


Video Transcript:

${transcript}

  
Generate the response ONLY as valid JSON:

{
  "summary": "",
  "simplifiedExplanation": "",
  "vocabulary": [
    {
      "word": "",
      "meaning": ""
    }
  ],
  "flashcards": [
    {
      "question": "",
      "answer": ""
    }
  ],
  "quiz": [
    {
      "question": "",
      "options": [],
      "answer": ""
    }
  ]
}
;`
}


async function adaptVideoTranscript(transcript, profile = {}) {

  if (!transcript || !transcript.trim()) {
    throw new Error("Video transcript is required");
  }


  const prompt = buildVideoAdaptationPrompt(
    transcript,
    profile
  );


  const result = await generate(prompt, {
    validate: (text) => {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("AI response is not valid JSON");
      }
    }
  });


  return result.data;
}


module.exports = {
  adaptVideoTranscript,
  buildVideoAdaptationPrompt,
};