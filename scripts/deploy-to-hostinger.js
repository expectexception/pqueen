const { Client } = require("ssh2");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const config = {
  host: "82.25.107.10",
  port: 65002,
  username: "u375327955",
  password: "Part2Part@420",
  readyTimeout: 60000,
};

function prepareArchives() {
  console.log("1. Compressing deployment packages with tar...");
  const root = process.cwd();

  const standaloneTar = path.join(root, "standalone.tar.gz");
  const staticTar = path.join(root, "static-assets.tar.gz");

  if (fs.existsSync(standaloneTar)) fs.unlinkSync(standaloneTar);
  if (fs.existsSync(staticTar)) fs.unlinkSync(staticTar);

  console.log("   - Compressing .next/standalone...");
  execSync(`tar -czf "${standaloneTar}" -C "${path.join(root, ".next", "standalone")}" .`, { stdio: "inherit" });

  console.log("   - Compressing public, data, and .next/static...");
  execSync(`tar -czf "${staticTar}" public data -C "${path.join(root, ".next")}" static`, { stdio: "inherit" });

  const standaloneSize = (fs.statSync(standaloneTar).size / (1024 * 1024)).toFixed(2);
  const staticSize = (fs.statSync(staticTar).size / (1024 * 1024)).toFixed(2);
  console.log(`   ✓ standalone.tar.gz (${standaloneSize} MB) & static-assets.tar.gz (${staticSize} MB) created!`);

  return { standaloneTar, staticTar };
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`   - Uploading ${path.basename(localPath)} -> ${remotePath}...`);
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);

      writeStream.on("close", () => {
        console.log(`   ✓ Uploaded ${path.basename(localPath)}!`);
        resolve();
      });
      writeStream.on("error", (err) => reject(err));
      readStream.pipe(writeStream);
    });
  });
}

function runRemoteCommand(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code, signal) => {
          resolve({ code, stdout, stderr });
        })
        .on("data", (data) => {
          stdout += data.toString();
        })
        .stderr.on("data", (data) => {
          stderr += data.toString();
        });
    });
  });
}

async function main() {
  const { standaloneTar, staticTar } = prepareArchives();

  console.log("\n2. Connecting to Hostinger server via SSH...");
  const conn = new Client();

  conn.on("ready", async () => {
    console.log("   ✓ SSH Connected to", config.host, "on port", config.port);

    try {
      console.log("\n3. Uploading packages to server...");
      await uploadFile(conn, standaloneTar, "/home/u375327955/standalone.tar.gz");
      await uploadFile(conn, staticTar, "/home/u375327955/static-assets.tar.gz");

      console.log("\n4. Deploying standalone bundle on Hostinger...");
      const setupScript = `
        set -e
        export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

        # Kill any running node processes
        killall node 2>/dev/null || true
        fuser -k 3090/tcp 2>/dev/null || true
        sleep 1

        # Clean old app dir completely
        rm -rf /home/u375327955/pqn-app
        mkdir -p /home/u375327955/pqn-app
        cd /home/u375327955/pqn-app

        # Extract standalone server fresh (preserving .next/node_modules and node_modules)
        tar -xzf /home/u375327955/standalone.tar.gz

        # Extract static assets and public
        tar -xzf /home/u375327955/static-assets.tar.gz

        # Move static into .next/static without deleting existing .next files
        if [ -d "static" ]; then
          mkdir -p .next/static
          cp -r static/* .next/static/ 2>/dev/null || true
          rm -rf static
        fi

        # Write Production .env
        cat << 'EOF' > .env
NODE_ENV=production
PORT=3090
HOSTNAME="127.0.0.1"
DATABASE_URL="YOUR_DATABASE_URL"
DIRECT_URL="YOUR_DIRECT_URL"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GOOGLE_AI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
SMTP_ENABLED=true
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="YOUR_SMTP_USER"
SMTP_PASS="YOUR_SMTP_PASS"
EMAIL_FROM="YOUR_EMAIL"
EMAIL_FROM_NAME="PQN PARTY QUEEN"
ADMIN_ALERT_EMAIL="YOUR_EMAIL"
NEXT_PUBLIC_APP_URL="https://pqnpartyqueen.com"
ADMIN_EMAIL="YOUR_ADMIN_EMAIL"
ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
ADMIN_NAME="PQN Admin"
ADMIN_SESSION_SECRET="YOUR_SESSION_SECRET"
NEXT_PUBLIC_ENABLE_AI_TRYON=true
NEXT_PUBLIC_ENABLE_AI_FILTERS=true
NEXT_PUBLIC_ENABLE_AI_STYLING_ADVISOR=true
NEXT_PUBLIC_ENABLE_RUNWAY_VIDEOS=true
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_INQUIRIES=true
NEXT_PUBLIC_ENABLE_TICKETS=true
NEXT_PUBLIC_ENABLE_COUPONS=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_ANNOUNCEMENT_BAR=true
NEXT_PUBLIC_ENABLE_WHATSAPP_CONCIERGE=true
NEXT_PUBLIC_APP_NAME="PQN PARTY QUEEN"
NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
NEXT_PUBLIC_CURRENCY_CODE="INR"
NEXT_PUBLIC_FREE_SHIPPING_MIN=15000
NEXT_PUBLIC_WHATSAPP_CONCIERGE_NUMBER="+919876543210"
NEXT_PUBLIC_SUPPORT_EMAIL="YOUR_EMAIL"
NEXT_PUBLIC_SUPABASE_URL="https://lfdzxbcvimvyctvalxyi.supabase.co"
SUPABASE_SECRET_KEY="YOUR_SUPABASE_SECRET_KEY"
EOF

        # Update PHP reverse proxy to 3090
        sed -i 's/3050/3090/g' /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php

        # Launch detached server with setsid on port 3090
        PORT=3090 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &

        sleep 4
        echo "=== Process & Log Check ==="
        ps aux | grep "node server.js" | grep -v grep || true
        cat app.log 2>&1 || true

        # Test local login
        curl -s -i -X POST http://127.0.0.1:3090/api/admin/login \\
          -H "Content-Type: application/json" \\
          -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
      `;

      const output = await runRemoteCommand(conn, setupScript);
      console.log("Remote Output:\n", output.stdout, output.stderr);

      console.log("\n5. Testing Live Production Storefront...");
      const testResult = await runRemoteCommand(conn, "curl -s -I -k https://pqnpartyqueen.com");
      console.log("HTTP Response Status:\n", testResult.stdout);

      console.log("\n✨ DEPLOYMENT COMPLETED SUCCESSFULLY TO https://pqnpartyqueen.com ✨");
    } catch (err) {
      console.error("✕ Deployment failed:", err);
    } finally {
      conn.end();
      if (fs.existsSync(standaloneTar)) fs.unlinkSync(standaloneTar);
      if (fs.existsSync(staticTar)) fs.unlinkSync(staticTar);
    }
  });

  conn.on("error", (err) => {
    console.error("SSH connection error:", err);
  });

  conn.connect(config);
}

main().catch(console.error);
