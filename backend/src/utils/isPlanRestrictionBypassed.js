/**
 * Single source of truth for Demo Mode on the backend.
 *
 * When this returns true, the plan/subscription gates (see
 * `middleware/requierPremium.js` and `middleware/requierFeature.js`) let every
 * authenticated user through. It never touches the plans, subscriptions or
 * payments tables.
 *
 * Demo Mode ON  (backend/.env): BYPASS_PLAN_RESTRICTIONS=true
 * Demo Mode OFF (backend/.env): BYPASS_PLAN_RESTRICTIONS=false
 *
 * `BYPASS_PLAN_CHECK` is kept as a legacy alias.
 */
function isTruthyFlag(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

module.exports = function isPlanRestrictionBypassed() {
  return (
    isTruthyFlag(process.env.BYPASS_PLAN_RESTRICTIONS) ||
    isTruthyFlag(process.env.BYPASS_PLAN_CHECK)
  );
};
