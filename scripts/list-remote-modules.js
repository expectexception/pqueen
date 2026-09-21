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
    const listModules = await runCommand(`
      cd /home/u375327955/pqn-app
      echo "=== Root node_modules ==="
      ls -la node_modules 2>&1 || true
      echo "=== .next/node_modules ==="
      ls -la .next/node_modules 2>&1 || true
      echo "=== .next/node_modules/@prisma ==="
      ls -la .next/node_modules/@prisma 2>&1 || true
    `);
    console.log("Module listing:\n", listModules.stdout);

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
