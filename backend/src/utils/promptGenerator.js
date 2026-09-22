// Builds the AI prompt in a modular, layered way:
// general rules -> language -> learning level -> accessibility needs -> feature objective -> lesson text.
// Adding a new accessibility profile (e.g. "autism", "low vision", "hearing impairment",
// or ADHD severity levels) only means adding one entry to NEED_ADAPTATIONS below —
// no other code changes are required.

// ---------------------------------------------------------------------------
// 0) General rules that always apply, regardless of feature/profile.
// ---------------------------------------------------------------------------
const GENERAL_RULES =
    "Return ONLY the requested content. Never add introductions, conclusions, or any " +
    "explanation of what you are doing, and never apologize. Never write one huge " +
    "paragraph. Use consistent Markdown formatting, keep spacing identical every time, " +
    "and keep the response clean and readable. Preserve important educational concepts " +
    "and produce professional educational content. The lesson content below is always " +
    "the only topic to write about \u2014 accessibility notes (if present) only change HOW " +
    "the response is written and formatted, never WHAT it is about.";

// ---------------------------------------------------------------------------
// 1) Feature objectives: WHAT to generate. Only these produce an output type.
// Each objective spells out the exact Markdown structure the AI must follow.
// ---------------------------------------------------------------------------
const BASE_PROMPTS = {
    summary:
        "Generate a lesson summary using exactly this Markdown structure:\n\n" +
        "# \uD83D\uDCD6 Lesson Summary\n\n" +
        "---\n\n" +
        "## \uD83C\uDFAF Key Concepts\n\n" +
        "- ...\n- ...\n- ...\n\n" +
        "---\n\n" +
        "## \uD83D\uDCCC Important Details\n\n" +
        "- ...\n- ...\n- ...\n\n" +
        "---\n\n" +
        "## \u2705 Quick Review\n\n" +
        "2-3 concise sentences.\n\n" +
        "Rules:\n" +
        "- Use the headings exactly as shown, including the emoji and the --- separators.\n" +
        "- Use bullet points for Key Concepts and Important Details.\n" +
        "- Keep paragraphs short.\n" +
        "- Never return a wall of text.",

    quiz:
        "Generate a quiz using exactly this Markdown structure, repeated for exactly 5 questions:\n\n" +
        "# \uD83D\uDCDD Quiz\n\n" +
        "---\n\n" +
        "## Question 1\n\n" +
        "**Question**\n\n" +
        "...\n\n" +
        "**Options**\n\n" +
        "- A) ...\n- B) ...\n- C) ...\n- D) ...\n\n" +
        "**\u2705 Correct Answer**\n\n" +
        "...\n\n" +
        "**\uD83D\uDCA1 Explanation**\n\n" +
        "...\n\n" +
        "---\n\n" +
        "Repeat the same format above (incrementing the question number) until there are " +
        "exactly 5 questions. Do not generate more or fewer than 5.\n\n" +
        "Rules:\n" +
        "- Exactly 5 questions, exactly 4 options each, one correct answer, one explanation.\n" +
        "- Separate every question using ---.\n" +
        "- Never change this layout.",

    flashcards:
        "Generate flashcards using exactly this Markdown structure, repeated between 8 and 10 times:\n\n" +
        "# \uD83D\uDDC2 Flashcards\n\n" +
        "---\n\n" +
        "## Flashcard 1\n\n" +
        "**Question**\n\n" +
        "...\n\n" +
        "**Answer**\n\n" +
        "...\n\n" +
        "---\n\n" +
        "Repeat the same format above (incrementing the flashcard number) for a total " +
        "between 8 and 10 flashcards.\n\n" +
        "Rules:\n" +
        "- Same layout for every flashcard, with consistent spacing.\n" +
        "- No introductions, no conclusions.",
};

// ---------------------------------------------------------------------------
// 2) Accessibility needs: HOW to adapt style/format. Never changes WHAT is
// generated, and unknown needs are ignored rather than causing an error.
// ---------------------------------------------------------------------------
const NEED_ADAPTATIONS = {
    adhd:
        "Keep paragraphs to a maximum of two short sentences. Use bullet points instead " +
        "of long blocks of text. Highlight important keywords using **bold**. Avoid long " +
        "explanations and reduce cognitive load so the content is easy to scan quickly.",

    dyslexia:
        "Use simple, everyday vocabulary and short sentences. Add clear spacing between " +
        "lines and sections. Prioritize easy readability over dense or elaborate wording.",
};

// ---------------------------------------------------------------------------
// 3) Learning level: HOW deep/technical the explanation should be.
// ---------------------------------------------------------------------------
const LEVEL_ADAPTATIONS = {
    beginner: "Use simple explanations and define any difficult terms.",
    intermediate: "Use balanced explanations, neither too simple nor overly technical.",
    advanced: "Preserve technical details and terminology.",
};

// ---------------------------------------------------------------------------
// 4) Response language. Every entry also reinforces that the Markdown
// structure/formatting must stay identical regardless of language.
// ---------------------------------------------------------------------------
const LANGUAGE_ADAPTATIONS = {
    arabic:
        "Respond entirely in Modern Standard Arabic. Keep the same Markdown structure and formatting.",
    english:
        "Respond entirely in English. Keep the same Markdown structure and formatting.",
    kurdish:
        "Respond entirely in Kurdish (Sorani), using clear and natural Kurdish. " +
        "Keep the same Markdown structure and formatting.",
};

// Returns the language instruction, or [] if none/unknown was requested.
function buildLanguageSection(profile) {
    const instruction = LANGUAGE_ADAPTATIONS[profile?.language];
    return instruction ? [instruction] : [];
}

// Returns the learning-level instruction, or [] if none/unknown was requested.
function buildLevelSection(profile) {
    const instruction = LEVEL_ADAPTATIONS[profile?.level];
    return instruction ? [instruction] : [];
}

// Returns instructions for every recognized accessibility need; unknown needs are ignored.
// Wrapped in a clarifying header so the model treats these as formatting/style rules
// for the lesson content, never as a topic to write about (e.g. it must not generate
// "content about ADHD" or "content about dyslexia").
function buildNeedsSection(profile) {
    const needs = Array.isArray(profile?.needs) ? profile.needs : [];
    const adaptations = needs.map((need) => NEED_ADAPTATIONS[need]).filter(Boolean);

    if (adaptations.length === 0) {
        return [];
    }

    const header =
        "Accessibility style instructions (apply ONLY to how the response below is written " +
        "and formatted \u2014 do NOT write about these needs, do NOT mention them, and do NOT " +
        "generate content about them as a subject):";

    return [`${header}\n${adaptations.map((adaptation) => `- ${adaptation}`).join("\n")}`];
}

/**
 * Builds the final prompt sent to the AI provider, layering instructions in
 * this fixed order: general rules -> language -> learning level ->
 * accessibility needs -> feature objective -> lesson text.
 *
 * @param {"summary"|"quiz"|"flashcards"} feature - what to generate
 * @param {{level?: string, language?: string, needs?: string[]}} profile - adaptation settings
 * @param {string} text - the lesson's extracted_text
 * @returns {string} the final prompt
 * @throws {Error} if `feature` is unsupported or `text` is empty
 */
function createPrompt(feature, profile, text) {
    const objective = BASE_PROMPTS[feature];

    if (!objective) {
        throw new Error(`Unsupported feature: ${feature}`);
    }

    if (!text || !text.trim()) {
        throw new Error("Lesson text is required to generate a prompt");
    }

    const sections = [
        GENERAL_RULES,
        ...buildLanguageSection(profile),
        ...buildLevelSection(profile),
        ...buildNeedsSection(profile),
        objective,
        `Lesson content:\n\n${text}`,
    ];

    return sections.join("\n\n");
}

module.exports = { createPrompt };

