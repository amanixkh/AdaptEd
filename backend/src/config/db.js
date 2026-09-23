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
	.query("SELECT NOW()")
	.then((result) => {
		console.log("PostgreSQL connected successfully!");
		console.log("Database time:", result.rows[0].now);
	})
	.catch((error) => {
		console.error("PostgreSQL connection error:", error.message);
		console.error("Check that PostgreSQL is running and the DB credentials in .env are correct.");
	});

module.exports = pool;