const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./src/config/db");

const historyRoutes = require("./src/routes/historyRoutes");
const lessonRoutes = require("./src/routes/lessonRoutes");
const geminiRoutes = require("./src/routes/geminiRoutes");
const generateRoutes = require("./src/routes/generateRoutes");
const authRoutes = require("./src/routes/authRoutes");
const testRoutes = require("./src/routes/testroutes");
const generatedContentRoutes = require("./src/routes/generatedContentRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/generated-content", generatedContentRoutes);
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/student", studentRoutes);

app.get("/", (req, res) => {
  res.send("AdaptEd backend is running!");
});

const PORT = process.env.PORT || 5000;
const HOST = "localhost";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});