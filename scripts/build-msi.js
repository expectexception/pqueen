const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

console.log("=== Terminating any running PQN Party Queen or Electron instances ===");
try {
  execSync('taskkill /F /IM "PQN Party Queen.exe" /T', { stdio: "ignore" });
} catch (e) {}
try {
  execSync('taskkill /F /IM electron.exe /T', { stdio: "ignore" });
} catch (e) {}

// Wait 1 second for OS locks to release
const sleep = (ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
};
sleep(1500);

// Clean any temporary .tmp folders
for (const outDir of ["dist-msi", "release"]) {
  const dirPath = path.join(root, outDir);
  const tmp = path.join(dirPath, "win-unpacked.tmp");
  if (fs.existsSync(tmp)) {
    console.log(`Cleaning up ${tmp}...`);
    try {
      fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
    } catch (err) {
      console.warn(`Could not rm ${tmp}:`, err.message);
    }
  }
}

console.log("=== Running prepare-desktop.js ===");
require("./prepare-desktop.js");

console.log("=== Invoking electron-builder for MSI target ===");
const builderCli = path.join(root, "node_modules", "electron-builder", "cli.js");
const result = spawnSync(process.execPath, [builderCli, "--win", "--x64"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env }
});

if (result.status !== 0) {
  console.error("Electron builder exited with code:", result.status);
  process.exit(result.status || 1);
}

console.log("\n✅ MSI Build Completed Successfully!");
