const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT) || 5432,
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	ssl: false,
});

pool.on("error", (error) => {
	console.error("Unexpected PostgreSQL client error:", error.message);
});

pool
	.query(`
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
		ALTER TABLE lessons ADD COLUMN IF NOT EXISTS language VARCHAR(5) NOT NULL DEFAULT 'en';
	`)
	.then(() => pool.query(`
		CREATE TABLE IF NOT EXISTS lesson_assignments (
			id SERIAL PRIMARY KEY,
			lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
			student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
			UNIQUE(lesson_id, student_id)
		);
		CREATE TABLE IF NOT EXISTS quiz_attempts (
			id SERIAL PRIMARY KEY,
			lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
			student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			score INTEGER NOT NULL,
			total INTEGER NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS chat_messages (
			id SERIAL PRIMARY KEY,
			user_id INT REFERENCES users(id) ON DELETE CASCADE,
			lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
			role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
			message TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`))
	.then(() => pool.query("SELECT NOW()"))
	.then((result) => {
		console.log("PostgreSQL connected successfully!");
		console.log("Database time:", result.rows[0].now);
	})
	.catch((error) => {
		console.error("PostgreSQL connection error:", error.message);
		console.error("Check that PostgreSQL is running and the DB credentials in .env are correct.");
	});

module.exports = pool;