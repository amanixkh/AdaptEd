const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./src/config/db");
const lessonRoutes = require("./src/routes/lessonRoutes");

const app = express();
app.use("/api/lessons", lessonRoutes);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("adaptes_ed Backend is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});