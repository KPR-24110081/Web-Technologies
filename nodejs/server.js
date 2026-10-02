import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

function logMiddleware(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function handleRequest(req, res) {
  logMiddleware(req, res, () => {
    let filePath;

    if (req.url === "/" || req.url === "/index.html") {
      filePath = path.join(PUBLIC_DIR, "index.html");
    } else if (req.url === "/about.html") {
      filePath = path.join(PUBLIC_DIR, "about.html");
    } else {
      send404(res);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        send404(res);
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    });
  });
}

const server = http.createServer(handleRequest);

function send404(res) {
  const notFoundPath = path.join(PUBLIC_DIR, "404.html");
  fs.readFile(notFoundPath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 - Page Not Found</h1>");
      return;
    }
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(content, "utf-8");
  });
}

server.on("error", (err) => {
  console.error(`Server error: ${err.message}`);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Homepage: http://localhost:${PORT}/`);
  console.log(`About:    http://localhost:${PORT}/about.html`);
});
