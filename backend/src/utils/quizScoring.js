const PASSING_PERCENTAGE = 50;

function computePercentage(score, total) {
  return total > 0 ? Math.round((score / total) * 10000) / 100 : 0;
}

function isPassed(percentage) {
  return percentage >= PASSING_PERCENTAGE;
}

module.exports = { PASSING_PERCENTAGE, computePercentage, isPassed };
