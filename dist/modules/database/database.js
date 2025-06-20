"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = executeQuery;
exports.closePool = closePool;
const dotenv_1 = __importDefault(require("dotenv"));
const promise_1 = __importDefault(require("mysql2/promise"));
dotenv_1.default.config();
// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'asterisk',
};
// Create a connection pool
const pool = promise_1.default.createPool(dbConfig);
// Function to execute a query
async function executeQuery(sql, params) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
// Function to close the pool
async function closePool() {
    await pool.end();
}
exports.default = pool;
