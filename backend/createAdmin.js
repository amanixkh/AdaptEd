const bcrypt = require("bcrypt");
const pool = require("./src/config/db");
const createAdmin = async () => { try { 
    const name = "AdaptEd Admin"; 
    const email = "admin@adapted.com"; 
    const password = "Admin@123456";
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
console.log("Password:", password);

process.exit(0);
} catch (error) { console.error("Create admin error:", error); 
    process.exit(1); } };
createAdmin();