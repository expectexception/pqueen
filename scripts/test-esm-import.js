const { Client } = require("ssh2");

const conn = new Client();

const config = {
  host: "82.25.107.10",
  port: 65002,
  username: "u375327955",
  password: "Part2Part@420",
  readyTimeout: 30000,
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
    console.log("\n--- TESTING ESM MODULE RESOLUTION IN CHUNKS DIR ---");

    const testEsm = `
      cd /home/u375327955/pqn-app/.next/server/chunks
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

      echo "=== Testing ESM import from chunks folder ==="
      /opt/alt/alt-nodejs22/root/usr/bin/node --input-type=module -e "
        try {
          const b = await import('bcryptjs-ee66c2bdc904f2cf');
          console.log('✓ bcryptjs import success:', Object.keys(b));
        } catch(e) {
          console.error('✕ bcryptjs import failed:', e.message);
        }
      "

      # Also test copying directory instead of symlink
      cp -r /home/u375327955/pqn-app/node_modules/bcryptjs /home/u375327955/pqn-app/node_modules/bcryptjs-ee66c2bdc904f2cf 2>/dev/null || true
      cp -r /home/u375327955/pqn-app/node_modules/@prisma/adapter-pg /home/u375327955/pqn-app/node_modules/@prisma/adapter-pg-994324666b79ccf3 2>/dev/null || true
      cp -r /home/u375327955/pqn-app/node_modules/@prisma/client /home/u375327955/pqn-app/node_modules/@prisma/client-2c3a283f134fdcb6 2>/dev/null || true
      cp -r /home/u375327955/pqn-app/node_modules/pg /home/u375327955/pqn-app/node_modules/pg-587764f78a6c7a9c 2>/dev/null || true

      echo "=== Testing ESM import after directory copy ==="
      /opt/alt/alt-nodejs22/root/usr/bin/node --input-type=module -e "
        try {
          const b = await import('bcryptjs-ee66c2bdc904f2cf');
          console.log('✓ bcryptjs import success:', typeof b.default || typeof b);
          const a = await import('@prisma/adapter-pg-994324666b79ccf3');
          console.log('✓ adapter-pg import success:', typeof a.default || typeof a);
        } catch(e) {
          console.error('✕ import failed:', e);
        }
      "
    `;

    const res = await runCommand(testEsm);
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
