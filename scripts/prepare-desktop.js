const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

console.log("================================================================================");
console.log("📦 PREPARING DESKTOP ASSETS & STANDALONE BUNDLE FOR ELECTRON");
console.log("================================================================================\n");

// 1. Verify standalone exists
if (!fs.existsSync(standalone)) {
  console.error("✕ Error: .next/standalone does not exist. Run 'npm run build' first!");
  process.exit(1);
}

// 2. Copy .next/static into .next/standalone/.next/static
const srcStatic = path.join(root, ".next", "static");
const destStatic = path.join(standalone, ".next", "static");
if (fs.existsSync(srcStatic)) {
  console.log("▶ Copying Next.js static assets (.next/static)...");
  fs.cpSync(srcStatic, destStatic, { recursive: true });
  console.log("  ✓ Static chunks copied successfully.");
}

// 3. Copy public into .next/standalone/public
const srcPublic = path.join(root, "public");
const destPublic = path.join(standalone, "public");
if (fs.existsSync(srcPublic)) {
  console.log("▶ Copying public media & brand assets (public)...");
  fs.cpSync(srcPublic, destPublic, { recursive: true });
  console.log("  ✓ Public assets copied successfully.");
}

// 4. Ensure .env is present in standalone
const srcEnv = path.join(root, ".env");
const destEnv = path.join(standalone, ".env");
if (fs.existsSync(srcEnv) && !fs.existsSync(destEnv)) {
  console.log("▶ Copying .env configuration to standalone...");
  fs.copyFileSync(srcEnv, destEnv);
  console.log("  ✓ .env copied.");
}

// 5. Ensure icon.ico and icon.png exist for Windows application icon
const destIco = path.join(root, "public", "icon.ico");
const srcAppIco = path.join(root, "app", "favicon.ico");
if (fs.existsSync(srcAppIco)) {
  console.log("▶ Copying app/favicon.ico to public/icon.ico...");
  fs.copyFileSync(srcAppIco, destIco);
  console.log("  ✓ icon.ico created.");
}

const destPng = path.join(root, "public", "icon.png");
const srcAppPng = path.join(root, "app", "icon.png");
if (fs.existsSync(srcAppPng)) {
  console.log("▶ Copying app/icon.png to public/icon.png...");
  fs.copyFileSync(srcAppPng, destPng);
  console.log("  ✓ icon.png updated.");
}

console.log("\n================================================================================");
console.log("✅ DESKTOP BUNDLE READY FOR ELECTRON-BUILDER PACKAGING");
console.log("================================================================================\n");
