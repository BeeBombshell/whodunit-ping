#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createNodeHandler } from "./index.js";

// Auto-load .env if present in current working directory
function autoLoadEnv() {
  // Use Node 20.6+ native loadEnvFile if available
  if (typeof (process as any).loadEnvFile === "function") {
    try {
      (process as any).loadEnvFile();
      return;
    } catch {}
  }

  // Graceful fallback parser for .env
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}

autoLoadEnv();

const port = parseInt(process.env["PORT"] || "3000", 10);
const host = process.env["HOST"] || "0.0.0.0";

try {
  const handler = createNodeHandler(process.env);
  const server = http.createServer(handler);

  server.listen(port, host, () => {
    // Note: Do not log sender headers or client IPs. Safe startup log only.
    console.log(`[Whodunit] Anonymous ping server running at http://${host}:${port}`);
    console.log(`[Whodunit] Active providers: ${process.env["PROVIDER"] || "ntfy"}`);
    console.log(`[Whodunit] Ready to accept POST requests at /ping or /`);
  });
} catch (err: any) {
  console.error(`[Whodunit Startup Error] ${err.message}`);
  process.exit(1);
}
