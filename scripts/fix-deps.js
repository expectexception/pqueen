const { Client } = require("ssh2");

const conn = new Client();

const config = {
  host: "82.25.107.10",
  port: 65002,
  username: "u375327955",
  password: "Part2Part@420",
  readyTimeout: 120000,
};

function runCommand(command) {
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

conn.on("ready", async () => {
  try {
    console.log("\n--- CLEAN REINSTALL OF NODE_MODULES ON LINUX ---");

    const cleanInstallScript = `
      cd /home/u375327955/pqn-app
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

      # Stop any running node
      killall node 2>/dev/null || true
      sleep 1

      # Remove broken symlinked node_modules from Windows
      rm -rf node_modules package-lock.json

      # Fresh install of production dependencies natively on Linux
      /opt/alt/alt-nodejs22/root/usr/bin/npm install --omit=dev --no-audit

      # Generate Prisma
      /opt/alt/alt-nodejs22/root/usr/bin/npx prisma generate

      # Test Database query directly
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const { PrismaPg } = require('@prisma/adapter-pg');
        const { PrismaClient } = require('@prisma/client');
        const adapter = new PrismaPg({ connectionString: 'postgresql://postgres.lfdzxbcvimvyctvalxyi:e4XrpXLer8BM3UZX@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
        const prisma = new PrismaClient({ adapter });
        prisma.category.findMany().then(cats => {
          console.log('>>> ✓ SUPABASE DATABASE CONNECTED! Categories found:', cats.length);
          process.exit(0);
        }).catch(err => {
          console.error('>>> ✕ DB Query Error:', err);
          process.exit(1);
        });
      "

      # Start server in background
      PORT=3050 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      sleep 4

      # Test Admin Login API
      curl -s -i -X POST http://127.0.0.1:3050/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    await runCommand(cleanInstallScript);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    conn.end();
  }
});

conn.on("error", (err) => {
  console.error("SSH Error:", err);
});

conn.connect(config);
