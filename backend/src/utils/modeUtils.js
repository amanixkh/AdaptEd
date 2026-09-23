// Central place for supported profile modes. Keep DB values, API responses,
// and validation all in sync with this single canonical list.
const MODE_DEFAULT = "Default";
const MODE_ADHD = "ADHD";
const MODE_DYSLEXIA = "Dyslexia";

const CANONICAL_MODES = [MODE_DEFAULT, MODE_ADHD, MODE_DYSLEXIA];

// Lowercased mode -> canonical (correctly-cased) mode, e.g. "dyslexia" -> "Dyslexia".
const MODE_LOOKUP = new Map(CANONICAL_MODES.map((mode) => [mode.toLowerCase(), mode]));

// Accepts any case/whitespace variant of a supported mode (e.g. "adhd", " ADHD ")
// and returns its canonical form, or null if the mode isn't recognized.
function normalizeMode(mode) {
    if (typeof mode !== "string") return null;
    return MODE_LOOKUP.get(mode.trim().toLowerCase()) ?? null;
}

module.exports = { normalizeMode, CANONICAL_MODES, MODE_DEFAULT, MODE_ADHD, MODE_DYSLEXIA };
