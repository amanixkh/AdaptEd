module.exports = function isPlanRestrictionBypassed() {
  return process.env.BYPASS_PLAN_RESTRICTIONS === "true"
    || process.env.BYPASS_PLAN_CHECK === "true";
};