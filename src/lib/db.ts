import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://zoommate:zoommate@localhost:5432/zoommate",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

export async function getMany(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

export default pool;
