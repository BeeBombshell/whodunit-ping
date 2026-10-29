import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.resolve(rootDir, "public");

// Auto-load .env
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.resolve(rootDir, ".env"));
  } catch {}
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Try loading node adapter handler if built
let nodeHandler = null;
try {
  const adapterPath = path.resolve(rootDir, "packages/adapters/node/dist/index.js");
  if (fs.existsSync(adapterPath)) {
    const { createNodeHandler } = await import(adapterPath);
    nodeHandler = createNodeHandler(process.env);
  }
} catch (err) {
  // Silent fallback for static-only dev
}

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "localhost";

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = reqUrl.pathname;

  // 1. API Route: /ping or /api/ping
  if (pathname === "/ping" || pathname === "/api/ping") {
    // Intercept demo pings so demo submissions never trigger real user notifications
    const isDemo = reqUrl.searchParams.get("demo") === "1" ||
      reqUrl.searchParams.get("demo") === "true" ||
      req.headers["x-whodunit-demo"] === "true";

    if (isDemo && req.method === "POST") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (nodeHandler) {
      return nodeHandler(req, res);
    }
    // Fallback if node adapter not built
    if (req.method === "POST") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, devNotice: "Handled by dev server fallback" }));
      return;
    }
  }

  // 1b. Demo redirect: /demo
  if (pathname === "/demo") {
    res.writeHead(302, { Location: "https://beebombshell.com/ping" });
    res.end();
    return;
  }

  // 2. Health check
  if (pathname === "/health" || pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", mode: "development" }));
    return;
  }

  // 3. Static File Serving from public/
  let filePath = path.join(publicDir, pathname === "/" ? "index.html" : pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  // If path is a directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // 4. 404 Fallback to index.html for SPA/Home or Not Found
  const indexPath = path.join(publicDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(port, host, () => {
  console.log(`\n🕵️‍♂️ [Whodunit] Local dev server running at:`);
  console.log(`   ➜ Local:   http://${host}:${port}/`);
  console.log(`   ➜ Health:  http://${host}:${port}/health`);
  console.log(`   ➜ API:     http://${host}:${port}/ping\n`);
});
