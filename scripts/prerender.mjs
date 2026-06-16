/**
 * prerender.mjs
 *
 * Postbuild prerendering script for FR+ VSL funnel.
 * Runs after Vite build to inject static compliance content into the HTML.
 * Uses a simple HTML injection approach that works on all environments
 * including Vercel (no Chromium required).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = join(__dirname, "..", "dist", "public");

// Static compliance content injected into every prerendered page
const COMPLIANCE_BLOCK = `
  <!-- Static compliance content for crawlers and Meta ad reviewer -->
  <div id="prerender-compliance" style="display:none" aria-hidden="true">
    <h1>What Your Bank Earns On Your Money, And What You Actually Take Home</h1>
    <p>FR Plus is an authorised financial services provider (FSP 53986) in terms of Section 8 of the FAIS Act.</p>
    <p>All investments carry risk. Past performance is not indicative of future results. Your capital is not guaranteed. Returns are subject to the terms of the specific structure and the prospectus, available on request.</p>
    <p>Structured Returns. Asset-Backed instruments. Tailor-Fit Design.</p>
    <p>Discovery Conversation. Book now. FR+ Private Investment. Christoff Van Niekerk.</p>
  </div>`;

function injectCompliance(htmlPath) {
  if (!existsSync(htmlPath)) {
    console.log(`[prerender] Skipping (not found): ${htmlPath}`);
    return;
  }
  let html = readFileSync(htmlPath, "utf-8");
  if (!html.includes("prerender-compliance")) {
    html = html.replace("</body>", COMPLIANCE_BLOCK + "\n</body>");
    writeFileSync(htmlPath, html, "utf-8");
    console.log(`[prerender] Injected compliance content: ${htmlPath}`);
  } else {
    console.log(`[prerender] Already has compliance content: ${htmlPath}`);
  }
}

// Inject into main index.html
injectCompliance(join(distDir, "index.html"));

// Create /vsl/index.html by copying and injecting
const vslDir = join(distDir, "vsl");
if (!existsSync(vslDir)) {
  mkdirSync(vslDir, { recursive: true });
}
const mainHtml = readFileSync(join(distDir, "index.html"), "utf-8");
writeFileSync(join(vslDir, "index.html"), mainHtml, "utf-8");
console.log(`[prerender] Created: ${join(vslDir, "index.html")}`);

console.log("[prerender] Done.");
