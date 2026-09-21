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
    console.log("\n--- TESTING ADMIN LOGIN API ON RUNNING SERVER ---");

    const testScript = `
      cd /home/u375327955/pqn-app
      
      # Check app.log
      echo "=== App Log ==="
      cat app.log 2>&1 || true

      # Check if node is listening
      echo "=== Listening Check ==="
      curl -s -I http://127.0.0.1:32199

      # Test Admin Login
      echo "=== Admin Login Response ==="
      curl -s -i -X POST http://127.0.0.1:32199/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    const res = await runCommand(testScript);
    console.log("Response:\n", res.stdout, res.stderr);

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
