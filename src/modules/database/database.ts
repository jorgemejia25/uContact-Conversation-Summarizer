import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'asterisk',
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Function to execute a query
export async function executeQuery<T>(sql: string, params?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Function to close the pool
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool; 