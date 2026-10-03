const bcrypt = require("bcrypt");
require("dotenv").config();
const pool = require("./src/config/db");

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME || "AdaptEd Admin";
    const email = (process.env.ADMIN_EMAIL || "admin@adapted.com").trim();
    const password = process.env.ADMIN_PASSWORD || "Admin@123456";

    if (!email || !password) {
      console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
      process.exit(1);
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Admin account already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
        (name, email, password, role)
      VALUES
        ($1, $2, $3, 'admin')
      RETURNING id, name, email, role
      `,
      [name, email, hashedPassword]
    );

    console.log("Admin created successfully:");
    console.log(result.rows[0]);

    console.log("\nLogin information:");
    console.log("Email:", email);
    if (!process.env.ADMIN_PASSWORD) {
      console.log("Password (default - set ADMIN_PASSWORD in .env to override):", password);
    } else {
      console.log("Password set from ADMIN_PASSWORD env var (hidden).");
    }

    process.exit(0);
  } catch (error) {
    console.error("Create admin error:", error);
    process.exit(1);
  }
};

createAdmin();
