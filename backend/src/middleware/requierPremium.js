const pool = require("../config/db");
const isPlanRestrictionBypassed = require("../utils/isPlanRestrictionBypassed");
// Plan gate. Demo Mode (BYPASS_PLAN_RESTRICTIONS=true in backend/.env) lets every
// authenticated user through; set the flag to "false" for the original behaviour.
const requirePremium = async (req, res, next) => {
  if (isPlanRestrictionBypassed()) { return next(); }
try { const result = await pool.query(`
  SELECT s.id, p.id AS plan_id,
   p.name AS plan_name, p.price_monthly,
    p.features, s.ends_at FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = $1 AND s.status = 'active'
      AND p.price_monthly > 0
      AND (s.ends_at IS NULL OR s.ends_at > NOW())
      LIMIT 1`, [req.user.id] );
if (result.rows.length === 0) {
  return res.status(403).json({
    success: false,
    message: "A paid subscription is required",
    code: "PREMIUM_REQUIRED",
  });
}

req.subscription = result.rows[0];
return next();
} catch (error) { console.error("Premium middleware error:", error); return res.status(500).json({ success: false, message: "Failed to verify subscription", }); } };
module.exports = requirePremium;