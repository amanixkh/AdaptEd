const pool = require("../config/db"); 
const requireFeature = (featureName) => async (req, res, next) => {
   if (process.env.BYPASS_PLAN_CHECK === "true") { 
    return next(); }
try { const result = await pool.query(`
  SELECT p.name AS plan_name, p.features,
   s.ends_at FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id WHERE s.user_id = $1 AND
    s.status = 'active'
     AND (s.ends_at IS NULL OR s.ends_at > NOW())
     LIMIT 1`, [req.user.id] );
if (result.rows.length === 0) {
  return res.status(403).json({
    success: false,
    message: "This feature requires a paid plan",
    code: "FEATURE_NOT_AVAILABLE",
  });
}

const features = result.rows[0].features || {};
if (!features[featureName]) {
  return res.status(403).json({
    success: false,
    message: `This feature is not available in your ${result.rows[0].plan_name} plan`,
    code: "FEATURE_NOT_AVAILABLE",
  });
}

req.subscription = result.rows[0];
return next();
} catch (error) { 
  console.error("Feature access error:", error);
   return res.status(500).json({ 
    success: false,
     message: "Failed to verify feature access"
     }); } };
module.exports = requireFeature;