"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./config/env");
const app_1 = require("./app");
/**
 * This script starts the application server.
 */
const PORT = parseInt(process.env.PORT || "8000");
const server = new app_1.AppServer();
server.start(PORT);
