const express = require("express");
const {
  getPlans,
  getSubscriptionStatus,
  upgradeSubscription,
} = require("../controllers/subscriptionController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/plans", getPlans);
router.get("/subscription/status", authMiddleware, getSubscriptionStatus);
router.post("/subscription/upgrade", authMiddleware, upgradeSubscription);

module.exports = router;