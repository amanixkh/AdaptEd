const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const testRoutes = require("./routes/testroutes.js");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("AdaptEd backend is running!");
});

const PORT = process.env.PORT || 5000;
const HOST = "localhost";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});