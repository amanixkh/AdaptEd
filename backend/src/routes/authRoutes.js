const express = require("express");
const { register, login } = require("../controllers/authcontrollers");
const router = express.Router();

router.get("/register", (req, res) => {
  res.status(405).json({
    message: "Use POST /api/auth/register to create a user.",
  });
});
router.get("/login", (req, res) => {
  res.status(405).json({
    message: "Use POST /api/auth/login to sign in.",
  });
});
router.post("/register", async (req, res) => {
  try {
    await register(req, res);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    await login(req, res);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;