import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing from .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000
});

export const connectDB = async () => {
  const client = await pool.connect();
  const res    = await client.query('SELECT NOW()');
  client.release();
  console.log(`✅ Supabase PostgreSQL Connected: ${res.rows[0].now}`);
};

export const db = {
  query:     (text, params) => pool.query(text, params),
  getClient: ()             => pool.connect()
};

export default pool;
