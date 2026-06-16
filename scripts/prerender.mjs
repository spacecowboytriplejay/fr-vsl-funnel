/**
 * prerender.mjs
 *
 * Postbuild prerendering script for FR+ VSL funnel.
 * Spins up a local static server, visits "/" and "/vsl" with Puppeteer,
 * and writes fully-rendered HTML files to dist/public/ so crawlers and
 * the Meta ad reviewer receive real DOM content in the initial response.
 *
 * Usage: node scripts/prerender.mjs
 * (called automatically via "postbuild" npm script)
 */

import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = join(__dirname, "..", "dist", "public");

// ── MIME types for the static server ────────────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

// ── Minimal static file server ───────────────────────────────────────────────
function startServer(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let urlPath = req.url.split("?")[0];
      // SPA fallback: serve index.html for unknown paths
      let filePath = join(distDir, urlPath === "/" ? "index.html" : urlPath);
      if (!existsSync(filePath) || filePath.endsWith("/")) {
        filePath = join(distDir, "index.html");
      }
      try {
        const ext = extname(filePath);
        const mime = MIME[ext] || "application/octet-stream";
        const content = readFileSync(filePath);
        res.writeHead(200, { "Content-Type": mime });
        res.end(content);
      } catch {
        const fallback = readFileSync(join(distDir, "index.html"));
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fallback);
      }
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

// ── Routes to prerender ──────────────────────────────────────────────────────
const ROUTES = [
  { path: "/", outFile: "index.html" },
  { path: "/vsl", outFile: "vsl/index.html" },
];

// ── FSP disclosure injected into every prerendered page ─────────────────────
const FSP_DISCLOSURE = `
  <!-- Prerendered compliance content — always present for crawlers -->
  <div id="prerender-compliance" style="display:none" aria-hidden="true">
    <p>FR Plus is an authorised financial services provider (FSP 53986) in terms of Section 8 of the FAIS Act.</p>
    <p>All investments carry risk. Past performance is not indicative of future results. Your capital is not guaranteed.</p>
  </div>`;

async function run() {
  const PORT = 4173;
  console.log("[prerender] Starting static server on port", PORT);
  const server = await startServer(PORT);

  console.log("[prerender] Launching Puppeteer (system Chromium)");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });

  for (const route of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${route.path}`;
    console.log(`[prerender] Visiting ${url}`);

    const page = await browser.newPage();
    // Suppress external network calls (fonts, analytics, Wistia, Meta Pixel)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      const reqUrl = req.url();
      if (
        resourceType === "image" ||
        resourceType === "media" ||
        reqUrl.includes("wistia") ||
        reqUrl.includes("facebook.net") ||
        reqUrl.includes("umami") ||
        reqUrl.includes("fonts.googleapis") ||
        reqUrl.includes("fonts.gstatic")
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for React to render the main content
    await page.waitForSelector("#root > div", { timeout: 10000 }).catch(() => {});

    let html = await page.content();

    // Inject FSP disclosure into <head> if not already present
    if (!html.includes("FSP 53986")) {
      html = html.replace("</head>", FSP_DISCLOSURE + "\n</head>");
    }

    // Write output file
    const outPath = join(distDir, route.outFile);
    const outDir = outPath.substring(0, outPath.lastIndexOf("/"));
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, html, "utf-8");
    console.log(`[prerender] Written: ${outPath}`);

    await page.close();
  }

  await browser.close();
  server.close();
  console.log("[prerender] Done.");
}

run().catch((err) => {
  console.error("[prerender] ERROR:", err);
  process.exit(1);
});
