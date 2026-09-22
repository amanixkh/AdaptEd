const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./src/config/db");
const pool = require("./config/db.js");

const lessonRoutes = require("./src/routes/lessonRoutes");
const geminiRoutes = require("./src/routes/geminiRoutes");
const generateRoutes = require("./src/routes/generateRoutes");
const authRoutes = require("./routes/authRoutes.js");
const testRoutes = require("./routes/testroutes.js");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);

// Routes
app.use("/api/lessons", lessonRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/generate", generateRoutes);

app.get("/", (req, res) => {
  res.send("AdaptEd backend is running!");
});

const PORT = process.env.PORT || 5000;
const HOST = "localhost";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});