// Link previews (Discord, WhatsApp, X…) need absolute URLs, which a static
// template can't know. Run after `expo export`: SITE_URL=https://… npm run export
import { readFileSync, writeFileSync } from "node:fs";

// On Vercel the production domain is known at build time, so previews work without SITE_URL.
const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = (process.env.SITE_URL || (vercel && `https://${vercel}`))?.replace(/\/$/, "");
if (!site) {
  console.warn("SITE_URL not set: link previews will have no image. Example: SITE_URL=https://enchants.example.com npm run export");
  process.exit(0);
}
const file = "dist/index.html";
const html = readFileSync(file, "utf8").replace(/(property="og:(?:image|url)"|name="twitter:image") content="\//g, `$1 content="${site}/`);
writeFileSync(file, html);
console.log(`Link previews point at ${site}`);
