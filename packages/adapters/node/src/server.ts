#!/usr/bin/env node
import http from "node:http";
import { createNodeHandler } from "./index.js";

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
