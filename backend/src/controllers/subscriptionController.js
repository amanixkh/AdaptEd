const pool = require("../config/db");
const isPlanRestrictionBypassed = require("../utils/isPlanRestrictionBypassed");

// ---------------------------------------------------------------------------
// Demo Mode (BYPASS_PLAN_RESTRICTIONS=true)
//
// While Demo Mode is on, `getSubscriptionStatus` reports a fully unlocked view
// of the caller's plan so that no client can mistake them for a restricted
// Starter user. This is a read-only projection: it never inserts or updates
// rows in the plans, subscriptions or payments tables, and it does not change
// the plan name or `isPaid`, so upgrades and real subscription records keep
// working exactly as before.
//
// When the flag is off the original payload is returned untouched.
// ---------------------------------------------------------------------------
function applyDemoUnlock(subscription) {
  if (!isPlanRestrictionBypassed()) return subscription;

  const features = { ...(subscription.features || {}) };
  for (const key of Object.keys(features)) {
    if (typeof features[key] === "boolean") features[key] = true;
  }

  const limits = { ...(subscription.limits || {}) };
  for (const key of Object.keys(limits)) {
    // `null` is the existing "unlimited" convention used by the paid plans.
    if (typeof limits[key] === "number") limits[key] = null;
  }

  return { ...subscription, features, limits, planRestrictionsBypassed: true };
}

const getPlans = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, tagline, price_monthly, price_yearly, currency,
              features, limits
       FROM plans
       WHERE is_active = TRUE
       ORDER BY price_monthly ASC`
    );
    return res.status(200).json({ success: true, plans: result.rows });
  } catch (error) {
    console.error("Get plans error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subscription plans" });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id AS subscription_id, s.status, s.billing_cycle,
              s.starts_at, s.ends_at, p.id AS plan_id, p.name AS plan_name,
              p.price_monthly, p.price_yearly, p.currency, p.features, p.limits
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active'
         AND (s.ends_at IS NULL OR s.ends_at > NOW())
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      const starterResult = await pool.query(
        `SELECT id, features, limits FROM plans WHERE name = 'Starter'`
      );
      const starter = starterResult.rows[0];
      return res.status(200).json({
        success: true,
        subscription: applyDemoUnlock({
          planId: starter ? starter.id : null,
          plan: "Starter",
          price: 0,
          currency: "IQD",
          billingCycle: null,
          status: "active",
          isPaid: false,
          features: starter ? starter.features : {},
          limits: starter ? starter.limits : {},
        }),
      });
    }

    const subscription = result.rows[0];
    const price = subscription.billing_cycle === "yearly"
      ? subscription.price_yearly
      : subscription.price_monthly;
    return res.status(200).json({
      success: true,
      subscription: applyDemoUnlock({
        id: subscription.subscription_id,
        planId: subscription.plan_id,
        plan: subscription.plan_name,
        price,
        currency: subscription.currency,
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        startsAt: subscription.starts_at,
        endsAt: subscription.ends_at,
        isPaid: Number(subscription.price_monthly) > 0,
        features: subscription.features,
        limits: subscription.limits,
      }),
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return res.status(500).json({ success: false, message: "Failed to get subscription status" });
  }
};

const upgradeSubscription = async (req, res) => {
  const client = await pool.connect();
  try {
    const { planId, billingCycle } = req.body || {};
    if (!planId) {
      return res.status(400).json({ success: false, message: "planId is required" });
    }

    const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const planResult = await client.query(
      `SELECT id, name, price_monthly, price_yearly, currency, features, limits
       FROM plans WHERE id = $1 AND is_active = TRUE`,
      [planId]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Subscription plan not found" });
    }

    const plan = planResult.rows[0];
    if (Number(plan.price_monthly) === 0) {
      return res.status(400).json({ success: false, message: "Starter plan does not require payment" });
    }

    const amount = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    const durationDays = cycle === "yearly" ? 365 : 30;
    const userId = req.user.id;
    await client.query("BEGIN");
    await client.query(
      `UPDATE subscriptions SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const subscriptionResult = await client.query(
      `INSERT INTO subscriptions
       (user_id, plan_id, billing_cycle, status, starts_at, ends_at)
       VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP,
               CURRENT_TIMESTAMP + ($4 * INTERVAL '1 day')) RETURNING *`,
      [userId, plan.id, cycle, durationDays]
    );
    const subscription = subscriptionResult.rows[0];
    const transactionId = `demo-${userId}-${Date.now()}`;
    const paymentResult = await client.query(
      `INSERT INTO payments
       (user_id, subscription_id, amount, currency, provider, status, transaction_id, paid_at)
       VALUES ($1, $2, $3, $4, 'demo', 'completed', $5, CURRENT_TIMESTAMP) RETURNING *`,
      [userId, subscription.id, amount, plan.currency, transactionId]
    );
    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Subscription upgraded successfully (Demo)",
      subscription: {
        id: subscription.id,
        planId: plan.id,
        plan: plan.name,
        price: amount,
        currency: plan.currency,
        billingCycle: cycle,
        status: subscription.status,
        startsAt: subscription.starts_at,
        endsAt: subscription.ends_at,
        features: plan.features,
        limits: plan.limits,
      },
      payment: {
        id: paymentResult.rows[0].id,
        amount,
        currency: plan.currency,
        provider: "demo",
        status: "completed",
        transactionId,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Upgrade subscription error:", error);
    return res.status(500).json({ success: false, message: "Failed to upgrade subscription" });
  } finally {
    client.release();
  }
};

module.exports = { getPlans, getSubscriptionStatus, upgradeSubscription };
