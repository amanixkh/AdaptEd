const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// MVP: the platform is teacher-only (no student dashboard/features yet).
// The users.role column is kept for future expansion (e.g. students),
// but self-registration is hardcoded to "teacher" and ignores any
// client-supplied role to prevent privilege escalation (e.g. "admin").
const SELF_REGISTER_ROLE = "teacher";

// Simple email format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async (req, res) => {
  try {
    // role is intentionally not read from req.body: see SELF_REGISTER_ROLE above
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Normalize email so "User@x.com" and "user@x.com" are treated as the same account
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Enforce column limits (users.name VARCHAR(100), users.email VARCHAR(150))
    // so oversized input fails with 400 instead of an unhandled Postgres error (500).
    if (name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({
        message: "Name must be between 1 and 100 characters",
      });
    }
    if (normalizedEmail.length > 150) {
      return res.status(400).json({
        message: "Email must be at most 150 characters",
      });
    }

    if (password.length < 6 || password.length > 72) {
      // bcrypt silently ignores bytes beyond 72, so cap the max as well
      return res.status(400).json({
        message: "Password must be between 6 and 72 characters",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name.trim(), normalizedEmail, hashedPassword, SELF_REGISTER_ROLE]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Normalize the same way as register so lookups match regardless of case
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      // Fail loudly instead of letting jwt.sign throw an opaque error
      console.error("Login error: JWT_SECRET is not configured");
      return res.status(500).json({
        message: "Server error",
        error: "JWT_SECRET is not configured",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = { register, login };