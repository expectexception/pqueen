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
    console.log("\n--- FIXING PRISMA GENERATION ON LINUX ---");

    const fixPrisma = await runCommand(`
      cd /home/u375327955/pqn-app
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH
      
      # Install prisma and client exact version
      /opt/alt/alt-nodejs22/root/usr/bin/npm install @prisma/client@7.9.1 prisma@7.9.1 pg @prisma/adapter-pg
      
      /opt/alt/alt-nodejs22/root/usr/bin/npx prisma generate
      
      # Test Prisma connection directly with a one-liner node script
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const { PrismaPg } = require('@prisma/adapter-pg');
        const { PrismaClient } = require('@prisma/client');
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        const prisma = new PrismaClient({ adapter });
        prisma.category.findMany().then(cats => {
          console.log('✓ Database query successful! Found categories:', cats.length);
          process.exit(0);
        }).catch(err => {
          console.error('✕ DB Error:', err);
          process.exit(1);
        });
      "
    `);
    console.log("Prisma Fix Output:\n", fixPrisma.stdout, fixPrisma.stderr);

    // Restart server
    await runCommand(`
      cd /home/u375327955/pqn-app
      killall node 2>/dev/null || true
      sleep 1
      PORT=3050 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      sleep 3
    `);

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
