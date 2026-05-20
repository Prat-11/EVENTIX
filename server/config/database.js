// database.js — connects to Supabase PostgreSQL using the pg client (no ORM)
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// check DATABASE_URL is set before doing anything
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL missing from .env');
  process.exit(1);
}

// Pool = a group of reusable connections — faster than opening a new one each request
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  max: 10,                            // max 10 connections at once
  connectionTimeoutMillis: 10000      // give up after 10s if can't connect
});

// test connection on startup
export const connectDB = async () => {
  try {
    const client = await pool.connect();       // grab a connection
    const res    = await client.query('SELECT NOW()'); // simple ping
    client.release();                          // give it back to pool
    console.log(`✅ Supabase PostgreSQL Connected: ${res.rows[0].now}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

// db.query — use this everywhere for SQL queries
// example: db.query('SELECT * FROM users WHERE id = $1', [userId])
export const db = {
  query:     (text, params) => pool.query(text, params),
  getClient: ()             => pool.connect() // for transactions
};

export default pool;
