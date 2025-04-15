// src/config/env.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Interface para type safety
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;
      PORT?: string;
      NODE_ENV?: "development" | "production";
    }
  }
}
