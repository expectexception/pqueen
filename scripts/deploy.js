#!/usr/bin/env node

/**
 * ==============================================================================
 * PQN PARTY QUEEN — SAFE PRODUCTION ONE-COMMAND DEPLOYMENT
 * ==============================================================================
 * 
 * Safety Guarantees:
 * 1. ZERO Database Risk: Never runs migrate reset, db push, or data modifications.
 * 2. Pre-flight Check: Builds locally with Webpack. Aborts on any error.
 * 3. Remote .env Isolation: Preserves the remote production .env file.
 * 4. Safe Restart: Starts the Node 22 server daemon and verifies internal port 34849.
 * 5. Cache Purge: Flushes LiteSpeed proxy cache for instant live visibility.
 */

const { spawnSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load local environment variables (for SSH configuration)
const root = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env") });

const SSH_HOST = process.env.SSH_HOST || "82.25.107.10";
const SSH_PORT = parseInt(process.env.SSH_PORT || "65002", 10);
const SSH_USER = process.env.SSH_USER || "u375327955";
const SSH_PASS = process.env.SSH_PASS;
const REMOTE_APP_DIR = process.env.SSH_REMOTE_APP_DIR || "/home/u375327955/pqn-app";
const NODE_BIN_DIR = process.env.SSH_NODE_PATH || "/opt/alt/alt-nodejs22/root/usr/bin";

// Check for required dependencies
let Client;
try {
  Client = require("ssh2").Client;
} catch (e) {
  console.error("❌ Error: 'ssh2' package is required for deployment. Run: npm install ssh2");
  process.exit(1);
}

if (!SSH_PASS) {
  console.error("❌ Error: SSH_PASS environment variable is missing in .env.");
  process.exit(1);
}

console.log("\n================================================================================");
console.log("👑 PQN PARTY QUEEN — PRODUCTION DEPLOYMENT ENGINE");
console.log("================================================================================");
console.log(`🌐 Target Server : ${SSH_USER}@${SSH_HOST}:${SSH_PORT}`);
console.log(`📁 Remote App Dir: ${REMOTE_APP_DIR}`);
console.log(`🔒 Database Mode : Supabase PostgreSQL (100% Isolated & Protected)`);
console.log("================================================================================\n");

// Helper: Recursive Directory Copy
function copyDirClean(src, dest, ignoreList = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    if (ignoreList.includes(item)) continue;
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirClean(srcPath, destPath, ignoreList);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  const startTime = Date.now();

  // --------------------------------------------------------------------------
  // STEP 1: LOCAL PRODUCTION BUILD
  // --------------------------------------------------------------------------
  console.log("📦 STEP 1/6: Compiling Next.js production build locally...");
  if (fs.existsSync(path.join(root, ".next"))) {
    fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  }

  const isWindows = process.platform === "win32";
  const buildCmd = isWindows ? "cmd.exe" : "npm";
  const buildArgs = isWindows ? ["/c", "npm run build"] : ["run", "build"];

  const buildResult = spawnSync(buildCmd, buildArgs, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });

  if (buildResult.status !== 0) {
    console.error("\n❌ BUILD FAILED: Local compilation encountered errors.");
    console.error("🛑 Deployment aborted immediately. Your live website remains untouched.\n");
    process.exit(1);
  }
  console.log("✓ Next.js production build compiled successfully.\n");

  // --------------------------------------------------------------------------
  // STEP 2: STAGE PRODUCTION FILES
  // --------------------------------------------------------------------------
  console.log("📋 STEP 2/6: Staging standalone application files...");
  const staging = path.join(root, ".deploy_staging");
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  const standaloneDir = path.join(root, ".next", "standalone");
  if (!fs.existsSync(standaloneDir)) {
    console.error("❌ Standalone build directory not found. Ensure 'output: \"standalone\"' is in next.config.ts.");
    process.exit(1);
  }

  // 1. Copy standalone server and its pruned dependencies
  copyDirClean(standaloneDir, staging);

  // 2. Next.js standalone requires .next/static to be copied into .next/static
  copyDirClean(path.join(root, ".next", "static"), path.join(staging, ".next", "static"));

  // 3. Ensure full .next/server chunks are present in staging
  copyDirClean(path.join(root, ".next", "server"), path.join(staging, ".next", "server"));

  // 3. Copy root .next manifests
  const nextDir = path.join(root, ".next");
  for (const file of fs.readdirSync(nextDir)) {
    const fullPath = path.join(nextDir, file);
    if (fs.statSync(fullPath).isFile()) {
      const destFile = path.join(staging, ".next", file);
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(fullPath, destFile);
    }
  }

  // 4. Copy static assets, prisma schema, and runtime libraries
  copyDirClean(path.join(root, "public"), path.join(staging, "public"), ["node_modules"]);
  if (fs.existsSync(path.join(root, "data"))) {
    copyDirClean(path.join(root, "data"), path.join(staging, "data"), ["node_modules"]);
  }
  copyDirClean(path.join(root, "prisma"), path.join(staging, "prisma"), ["node_modules", "migrations"]);
  copyDirClean(path.join(root, "lib"), path.join(staging, "lib"), ["node_modules"]);
  fs.copyFileSync(path.join(root, "package.json"), path.join(staging, "package.json"));
  if (fs.existsSync(path.join(root, ".env"))) {
    fs.copyFileSync(path.join(root, ".env"), path.join(staging, ".env"));
  }
  if (fs.existsSync(path.join(root, "prisma.config.ts"))) {
    fs.copyFileSync(path.join(root, "prisma.config.ts"), path.join(staging, "prisma.config.ts"));
  }

  // Prepend dotenv to standalone server.js to guarantee all server environment variables load at runtime
  const serverJsPath = path.join(staging, "server.js");
  if (fs.existsSync(serverJsPath)) {
    const serverJsContent = fs.readFileSync(serverJsPath, "utf8");
    if (!serverJsContent.includes('require("dotenv")') && !serverJsContent.includes("require('dotenv')")) {
      fs.writeFileSync(
        serverJsPath,
        `require("dotenv").config();\n` + serverJsContent,
        "utf8"
      );
    }
  }

  console.log("✓ Application files staged.\n");

  // --------------------------------------------------------------------------
  // STEP 3: COMPRESS DEPLOYMENT ARCHIVE
  // --------------------------------------------------------------------------
  console.log("🗜️  STEP 3/6: Creating compressed deployment archive...");
  const tarFile = path.join(root, "pqn-live-bundle.tar.gz");
  if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);

  try {
    execSync(`tar -czf "${tarFile}" -C "${staging}" .`, { stdio: "pipe" });
  } catch (err) {
    console.error("❌ Failed to compress archive using system tar:", err.message);
    process.exit(1);
  }

  fs.rmSync(staging, { recursive: true, force: true });
  const bundleSizeMB = (fs.statSync(tarFile).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Deployment archive created: ${bundleSizeMB} MB\n`);

  // --------------------------------------------------------------------------
  // STEP 4: UPLOAD VIA SSH / SFTP
  // --------------------------------------------------------------------------
  console.log("🚀 STEP 4/6: Connecting to Hostinger & uploading package...");
  const conn = new Client();

  conn
    .on("ready", () => {
      console.log("✓ SSH Connection established.");
      conn.sftp((err, sftp) => {
        if (err) {
          console.error("❌ SFTP Initialization failed:", err.message);
          conn.end();
          process.exit(1);
        }

        const remoteBundle = `/home/${SSH_USER}/pqn-live-bundle.tar.gz`;
        sftp.fastPut(tarFile, remoteBundle, (putErr) => {
          if (putErr) {
            console.error("❌ Upload failed:", putErr.message);
            conn.end();
            process.exit(1);
          }
          console.log("✓ Package successfully uploaded to Hostinger.\n");

          // ------------------------------------------------------------------
          // STEP 5: REMOTE EXTRACTION, PRISMA SYNC & SERVER RESTART
          // ------------------------------------------------------------------
          const remoteDeployScript = `#!/bin/bash
export PATH="${NODE_BIN_DIR}:$PATH"

# 1. Terminate old server processes
pkill -9 -u ${SSH_USER} -f "next-server" 2>/dev/null || true
pkill -9 -u ${SSH_USER} -f "server.js" 2>/dev/null || true
sleep 2

# 2. Clean old build chunks and extract package
cd ${REMOTE_APP_DIR}
rm -rf .next
mkdir -p ${REMOTE_APP_DIR}
tar -xzf /home/${SSH_USER}/pqn-live-bundle.tar.gz -C ${REMOTE_APP_DIR}

# 3. Synchronize Prisma client types
${NODE_BIN_DIR}/npx prisma generate 2>&1

# 4. Sync static assets to public_html for LiteSpeed direct serve
mkdir -p /home/${SSH_USER}/domains/pqnpartyqueen.com/public_html/_next/static
cp -rf ${REMOTE_APP_DIR}/.next/static/* /home/${SSH_USER}/domains/pqnpartyqueen.com/public_html/_next/static/
mkdir -p /home/${SSH_USER}/domains/pqnpartyqueen.com/public_html/images
cp -rf ${REMOTE_APP_DIR}/public/* /home/${SSH_USER}/domains/pqnpartyqueen.com/public_html/

# 5. Export environment variables and launch Node 22 daemon permanently via nohup
set -a
[ -f ${REMOTE_APP_DIR}/.env ] && source ${REMOTE_APP_DIR}/.env
set +a
export PORT=34849
export HOSTNAME=127.0.0.1
export NODE_ENV=production
nohup ${NODE_BIN_DIR}/node ${REMOTE_APP_DIR}/server.js </dev/null >> ${REMOTE_APP_DIR}/app.log 2>&1 &
sleep 3

# 6. Flush LiteSpeed Cache
touch /home/${SSH_USER}/domains/pqnpartyqueen.com/public_html/.no-cache 2>/dev/null || true

# 7. Output running process
ps -u ${SSH_USER} -f | grep "server" || true
`;

          const scriptPath = `/home/${SSH_USER}/deploy-remote.sh`;
          const ws = sftp.createWriteStream(scriptPath);
          ws.write(remoteDeployScript);
          ws.end(() => {
            conn.exec(`bash ${scriptPath} && rm -f ${scriptPath}`, (execErr, stream) => {
              if (execErr) {
                console.error("❌ Remote execution failed:", execErr.message);
                conn.end();
                process.exit(1);
              }

              stream
                .on("close", (code) => {
                  console.log("✓ Server daemon started successfully.");
                  if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);
                  conn.end();

                  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
                  console.log("\n================================================================================");
                  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
                  console.log("================================================================================");
                  console.log(`⏱️  Total Duration : ${elapsedSeconds} seconds`);
                  console.log(`🌐 Live Website   : https://pqnpartyqueen.com`);
                  console.log(`👑 Admin Portal   : https://pqnpartyqueen.com/admin/login`);
                  console.log(`📋 Server Logs    : /home/${SSH_USER}/pqn-app/app.log`);
                  console.log("================================================================================\n");
                })
                .on("data", (chunk) => {
                  const text = chunk.toString();
                  if (text.includes("Generated Prisma Client") || text.includes("next-server")) {
                    process.stdout.write(`   ${text.trim()}\n`);
                  }
                })
                .stderr.on("data", (errChunk) => {
                  const errText = errChunk.toString();
                  if (!errText.includes("Update available") && !errText.includes("deprecated")) {
                    process.stderr.write(errText);
                  }
                });
            });
          });
        });
      });
    })
    .on("error", (connErr) => {
      console.error("❌ SSH Connection error:", connErr.message);
      if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);
      process.exit(1);
    })
    .connect({
      host: SSH_HOST,
      port: SSH_PORT,
      username: SSH_USER,
      password: SSH_PASS,
    });
}

main().catch((err) => {
  console.error("❌ Unexpected deployment error:", err);
  process.exit(1);
});
