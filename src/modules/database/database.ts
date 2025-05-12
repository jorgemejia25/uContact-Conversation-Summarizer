import { config } from "../../config";
import mysql from "mysql2/promise";

// Configuración de la conexión
const dbConfig = {
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Agregar timeout más largo
  connectTimeout: 60000,
  // Agregar opciones de reconexión
  acquireTimeout: 60000,
  timeout: 60000,
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para verificar la conexión
async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error("Error checking database connection:", error);
    return false;
  }
}

// Función para ejecutar consultas con reintentos
export async function executeQuery<T>(
  query: string,
  params: any[] = [],
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar la conexión antes de ejecutar la consulta
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error("Database connection is not available");
      }

      const [rows] = await pool.execute(query, params);
      return rows as T;
    } catch (error) {
      lastError = error as Error;
      console.error(`Query attempt ${attempt} failed:`, {
        error,
        query,
        params,
      });

      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        throw new Error(
          `Database query failed after ${maxRetries} attempts: ${lastError.message}`
        );
      }

      // Esperar antes de reintentar (backoff exponencial)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Manejar eventos del pool
pool.on("connection", (connection) => {
  console.log("New connection established with database");

  connection.on("error", (err) => {
    console.error("Database connection error:", err);
  });
});

pool.on("acquire", (connection) => {
  console.log("Connection acquired from pool");
});

pool.on("release", (connection) => {
  console.log("Connection released back to pool");
});

// Exportar el pool para uso directo si es necesario
export { pool };
