const { Pool } = require("pg");
require("dotenv").config({ path: __dirname + "/.env" });
console.log("DB_PASSWORD from .env:", process.env.DB_PASSWORD);
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("Connection error", err));

module.exports = pool;
