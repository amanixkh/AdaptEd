const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const ALLOWED_ROLES = ["teacher", "student"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }
    const normalizedRole = String(role || "").trim().toLowerCase();
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        message: "Role must be either 'teacher' or 'student'",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

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
      [name.trim(), normalizedEmail, hashedPassword, normalizedRole]
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

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = $1",
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