import { config } from "dotenv";
import path from "path";
import fs from "fs";

// Check if .env file exists and load it
const envPath = path.join(__dirname, "../../.env");
if (!fs.existsSync(envPath)) {
  throw new Error(
    "ERROR: .env file not found at: " +
      envPath +
      "\nPlease create a .env file in the backend directory with the required environment variables."
  );
}

// Load environment variables
const result = config({ path: envPath });
if (result.error) {
  throw new Error(
    "ERROR: Failed to load environment variables from .env file: " +
      result.error.message
  );
}

// Validate required environment variables
const requiredEnvVars = [
  "DB_URI",
  "PORT",
  "GOOGLE_MAPS_API_KEY",
  "FIREBASE_CREDENTIALS_JSON_PATHNAME",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `ERROR: Required environment variable ${envVar} is not set in .env file`
    );
  }
}
