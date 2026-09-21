const { Client } = require("ssh2");

const conn = new Client();

const config = {
  host: "82.25.107.10",
  port: 65002,
  username: "u375327955",
  password: "Part2Part@420",
  readyTimeout: 60000,
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
        })
        .stderr.on("data", (data) => {
          stderr += data.toString();
        });
    });
  });
}

conn.on("ready", async () => {
  try {
    console.log("\n--- SEEDING ADMIN ACCOUNT & STARTING PRODUCTION SERVER ---");

    const seedAndStart = `
      cd /home/u375327955/pqn-app
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

      # Seed Admin
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
          console.log('>>> ✓ ADMIN USER SEEDED IN DATABASE:', admin.email, admin.name);
          const products = await prisma.product.count();
          console.log('>>> ✓ TOTAL PRODUCTS IN SUPABASE:', products);
          process.exit(0);
        }
        seed().catch(e => { console.error('✕ DB Seed Error:', e); process.exit(1); });
      "

      # Kill any old node processes
      for pid in $(ps -u u375327955 -o pid,comm | grep node | awk '{print $1}'); do
        kill -9 $pid 2>/dev/null || true
      done
      sleep 2

      # Start server on 35892
      PORT=35892 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      sleep 4

      echo "=== Testing Admin Login API ==="
      curl -s -i -X POST http://127.0.0.1:35892/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    const res = await runCommand(seedAndStart);
    console.log("Output:\n", res.stdout, res.stderr);

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
