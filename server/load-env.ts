// Loads env vars from local env files before any other module reads process.env.
import { config } from "dotenv";

// Load environment variables from local env files before any other module
// (e.g. server/db.ts) reads process.env at import time. tsx/Node does not
// auto-load .env files the way some frameworks do, so we do it explicitly.
// Later files do not override variables already set in the real environment.
config({ path: ".env.development.local" });
config({ path: ".env.local" });
config(); // .env fallback
