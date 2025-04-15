import "reflect-metadata";
import "./config/env";

import { AppServer } from "./app";

/**
 * This script starts the application server.
 */
const PORT = parseInt(process.env.PORT || "3000");
const server = new AppServer();
server.start(PORT);
