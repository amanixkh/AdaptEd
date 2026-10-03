const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./src/config/db");

const { startNotificationJobs } = require("./src/jobs/notificationjobs");

const historyRoutes = require("./src/routes/historyRoutes");
const lessonRoutes = require("./src/routes/lessonRoutes");
const geminiRoutes = require("./src/routes/geminiRoutes");
const generateRoutes = require("./src/routes/generateRoutes");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const testRoutes = require("./src/routes/testroutes");
const generatedContentRoutes = require("./src/routes/generatedContentRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const videoRoutes = require("./src/routes/videoRoutes");
const shareRoutes = require("./src/routes/shareRoutes");
const teacherStudentRoutes = require("./src/routes/teacherStudentRoutes");
const liveClassRoutes = require("./src/routes/liveClassRoutes");
const lessonFileRoutes = require("./src/routes/lessonFileRoutes");
const contactRoutes = require("./src/routes/contactRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);

app.use("/api/generated-content", generatedContentRoutes);
app.use("/api/test", testRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/lessons", lessonFileRoutes);
app.use("/api/lessons", lessonRoutes);

app.use("/api/gemini", geminiRoutes);
app.use("/api/generate", generateRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/student", studentRoutes);

app.use("/api", subscriptionRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api", shareRoutes);
app.use("/api", teacherStudentRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => {
  res.send("AdaptEd backend is running!");
});

// Notifications are produced by scheduled jobs (new-lesson reconciliation,
// score improvement, learning streak and inactivity reminders). Start the
// scheduler so those jobs actually run while the app is running.
startNotificationJobs();

const PORT = process.env.PORT || 5000;
const HOST = "localhost";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});