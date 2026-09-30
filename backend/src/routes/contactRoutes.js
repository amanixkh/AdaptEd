const express = require("express");
const { sendContactMessage } = require("../controllers/contactController");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await sendContactMessage(req, res);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
