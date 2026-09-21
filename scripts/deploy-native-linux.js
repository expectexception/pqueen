const { Client } = require("ssh2");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const config = {
  host: "82.25.107.10",
  port: 65002,
  username: "u375327955",
  password: "Part2Part@420",
  readyTimeout: 120000,
};

function copyDirClean(src, dest, excludeNames = ["node_modules"]) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeNames.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirClean(srcPath, destPath, excludeNames);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function prepareCleanBundle() {
  console.log("1. Preparing clean deployment bundle (excluding Windows node_modules)...");
  const root = process.cwd();
  const staging = path.join(root, "deploy-staging-clean");

  if (fs.existsSync(staging)) {
    fs.rmSync(staging, { recursive: true, force: true });
  }
  fs.mkdirSync(staging, { recursive: true });

  // 1. Copy standalone files without node_modules
  const standaloneDir = path.join(root, ".next", "standalone");
  if (fs.existsSync(standaloneDir)) {
    copyDirClean(standaloneDir, staging, ["node_modules"]);
  }

  // 2. Fresh .next/server
  const serverDir = path.join(root, ".next", "server");
  const destServerDir = path.join(staging, ".next", "server");
  if (fs.existsSync(serverDir)) {
    copyDirClean(serverDir, destServerDir, ["node_modules"]);
  }

  // 3. Static files
  const staticDir = path.join(root, ".next", "static");
  const destStaticDir = path.join(staging, ".next", "static");
  if (fs.existsSync(staticDir)) {
    copyDirClean(staticDir, destStaticDir, ["node_modules"]);
  }

  // 4. All manifest and json files from .next root
  const nextDir = path.join(root, ".next");
  const nextFiles = fs.readdirSync(nextDir);
  for (const file of nextFiles) {
    const fullPath = path.join(nextDir, file);
    if (fs.statSync(fullPath).isFile()) {
      const destFile = path.join(staging, ".next", file);
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(fullPath, destFile);
    }
  }

  // 5. Copy public folder
  copyDirClean(path.join(root, "public"), path.join(staging, "public"), ["node_modules"]);

  // 6. Copy data folder
  copyDirClean(path.join(root, "data"), path.join(staging, "data"), ["node_modules"]);

  // 7. Copy prisma folder
  copyDirClean(path.join(root, "prisma"), path.join(staging, "prisma"), ["node_modules"]);

  // 8. Copy root package.json & prisma.config.ts
  fs.copyFileSync(path.join(root, "package.json"), path.join(staging, "package.json"));
  if (fs.existsSync(path.join(root, "prisma.config.ts"))) {
    fs.copyFileSync(path.join(root, "prisma.config.ts"), path.join(staging, "prisma.config.ts"));
  }

  // Compress
  console.log("2. Compressing clean archive deploy-clean.tar.gz...");
  const tarFile = path.join(root, "deploy-clean.tar.gz");
  if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);

  execSync(`tar -czf "${tarFile}" -C "${staging}" .`, { stdio: "inherit" });
  const sizeMb = (fs.statSync(tarFile).size / (1024 * 1024)).toFixed(2);
  console.log(`   ✓ deploy-clean.tar.gz created successfully (${sizeMb} MB)`);

  // Cleanup staging
  fs.rmSync(staging, { recursive: true, force: true });
  return tarFile;
}


function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`3. Uploading ${path.basename(localPath)} (${(fs.statSync(localPath).size / 1024 / 1024).toFixed(2)} MB) -> ${remotePath}...`);
      sftp.fastPut(localPath, remotePath, (uploadErr) => {
        if (uploadErr) return reject(uploadErr);
        console.log(`   ✓ Upload complete!`);
        resolve();
      });
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
          process.stdout.write(data);
        })
        .stderr.on("data", (data) => {
          stderr += data.toString();
          process.stderr.write(data);
        });
    });
  });
}

async function main() {
  const tarFile = prepareCleanBundle();

  console.log("\n4. Connecting to Hostinger server via SSH...");
  const conn = new Client();

  conn.on("ready", async () => {
    console.log("   ✓ SSH Connected to", config.host, "on port", config.port);

    try {
      await uploadFile(conn, tarFile, "/home/u375327955/deploy-clean.tar.gz");

      console.log("\n5. Extracting and performing Native Linux installation...");
      const setupScript = `
        set -e
        export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

        # Kill any running server instances
        /opt/alt/alt-nodejs22/root/usr/bin/node -e "
          const fs = require('fs');
          const pids = fs.readdirSync('/proc').filter(f => /^\\\\d+$/.test(f));
          for (const pid of pids) {
            try {
              const cmd = fs.readFileSync('/proc/' + pid + '/cmdline', 'utf8');
              if (cmd.includes('server.js')) {
                if (pid != process.pid) {
                  process.kill(Number(pid), 'SIGKILL');
                }
              }
            } catch(e) {}
          }
        " || true
        sleep 1

        # Completely clean directory
        rm -rf /home/u375327955/pqn-app
        mkdir -p /home/u375327955/pqn-app
        cd /home/u375327955/pqn-app

        # Extract clean code
        tar -xzf /home/u375327955/deploy-clean.tar.gz

        echo "=== Extracted API routes verification ==="
        ls -la .next/server/app/api/auth/

        FREE_PORT=34849
        echo "Using Fixed Dedicated Port: $FREE_PORT"

        # Write Production .env
        cat << EOF > .env
NODE_ENV=production
PORT=$FREE_PORT
HOSTNAME="127.0.0.1"
DATABASE_URL="YOUR_DATABASE_URL"
DIRECT_URL="YOUR_DIRECT_URL"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GOOGLE_AI_API_KEY="YOUR_GOOGLE_AI_API_KEY"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
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
NEXT_PUBLIC_SUPPORT_EMAIL="thep4rtyqueen@gmail.com"
NEXT_PUBLIC_SUPABASE_URL="https://lfdzxbcvimvyctvalxyi.supabase.co"
SUPABASE_SECRET_KEY="YOUR_SUPABASE_SECRET_KEY"
EOF

        # Install Linux Native Dependencies
        echo "Installing production node_modules natively on Linux..."
        /opt/alt/alt-nodejs22/root/usr/bin/npm install --omit=dev --no-audit

        # Generate Prisma for Linux
        echo "Generating Prisma Client..."
        /opt/alt/alt-nodejs22/root/usr/bin/npx prisma generate

        # Seed & verify admin in Database
        echo "Verifying Database Admin Account..."
        /opt/alt/alt-nodejs22/root/usr/bin/node -e "
          const { PrismaPg } = require('@prisma/adapter-pg');
          const { PrismaClient } = require('@prisma/client');
          const bcrypt = require('bcryptjs');
          const adapter = new PrismaPg({ connectionString: 'postgresql://postgres.lfdzxbcvimvyctvalxyi:e4XrpXLer8BM3UZX@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
          const prisma = new PrismaClient({ adapter });

          async function seed() {
            const hash = await bcrypt.hash('Karan@123', 10);
            const admin = await prisma.admin.upsert({
              where: { email: 'P4RTYqueen@gmail.com' },
              update: { passwordHash: hash, name: 'PQN Admin' },
              create: { email: 'P4RTYqueen@gmail.com', passwordHash: hash, name: 'PQN Admin' }
            });
            console.log('>>> ✓ ADMIN USER READY IN SUPABASE:', admin.email);
            const products = await prisma.product.count();
            console.log('>>> ✓ TOTAL PRODUCTS IN SUPABASE:', products);
            process.exit(0);
          }
          seed().catch(e => { console.error('✕ DB Seed Error:', e); process.exit(1); });
        "

        # Update PHP reverse proxy
        cat << 'EOF' > /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php
<?php
// PQN Party Queen - High-Performance Reverse Proxy Bridge
$backend = 'http://127.0.0.1:34849';
$reqUri = $_SERVER['REQUEST_URI'];
$url = $backend . $reqUri;

$isStatic = strpos($reqUri, '/_next/static/') === 0;

$ch = curl_init($url);
$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}
$headers[] = 'Host: ' . $_SERVER['HTTP_HOST'];
$headers[] = 'X-Forwarded-For: ' . (isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR']);
$headers[] = 'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
$headers[] = 'X-Real-IP: ' . $_SERVER['REMOTE_ADDR'];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><body style="background:#072818;color:#f5d77f;text-align:center;padding:60px;"><h2>PQN Atelier Initializing...</h2></body></html>';
    curl_close($ch);
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$header_text = substr($response, 0, $header_size);
$body = substr($response, $header_size);
curl_close($ch);

http_response_code($http_code);

foreach (explode("\r\n", $header_text) as $header_line) {
    if (!empty($header_line)
        && !preg_match('/^HTTP\//i', $header_line)
        && !preg_match('/^Transfer-Encoding:/i', $header_line)
        && !preg_match('/^Cache-Control:/i', $header_line)
        && !preg_match('/^Pragma:/i', $header_line)
        && !preg_match('/^Expires:/i', $header_line)
    ) {
        header($header_line, false);
    }
}

if ($isStatic) {
    header("Cache-Control: public, max-age=31536000, immutable", true);
} else {
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0", true);
    header("Pragma: no-cache", true);
    header("Expires: Thu, 01 Jan 1970 00:00:00 GMT", true);
    header("Surrogate-Control: no-store", true);
    header("CDN-Cache-Control: no-store", true);
}

echo $body;
EOF

        # Launch Node server detached as daemon
        /opt/alt/alt-nodejs22/root/usr/bin/node -e "
          const { spawn } = require('child_process');
          const fs = require('fs');

          const out = fs.openSync('/home/u375327955/pqn-app/app.log', 'w');
          const err = fs.openSync('/home/u375327955/pqn-app/app.log', 'w');

          const child = spawn('/opt/alt/alt-nodejs22/root/usr/bin/node', ['server.js'], {
            cwd: '/home/u375327955/pqn-app',
            env: {
              ...process.env,
              PORT: '34849',
              HOSTNAME: '127.0.0.1',
              NODE_ENV: 'production',
              PATH: '/opt/alt/alt-nodejs22/root/usr/bin:' + process.env.PATH
            },
            detached: true,
            stdio: ['ignore', out, err]
          });

          child.unref();
          console.log('>>> Node server permanently launched with PID:', child.pid);
        "
        sleep 4

        echo "=== App Log ==="
        cat app.log 2>&1 || true

        echo "=== Testing Admin Login API on Localhost ==="
        curl -s -i -X POST http://127.0.0.1:34849/api/admin/login \\
          -H "Content-Type: application/json" \\
          -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
      `;

      await runRemoteCommand(conn, setupScript);

      console.log("\n✨ DEPLOYMENT COMPLETED! ✨");
    } catch (err) {
      console.error("✕ Deployment failed:", err);
    } finally {
      conn.end();
      if (fs.existsSync(tarFile)) fs.unlinkSync(tarFile);
    }
  });

  conn.on("error", (err) => {
    console.error("SSH Error:", err);
  });

  conn.connect(config);
}

main().catch(console.error);
