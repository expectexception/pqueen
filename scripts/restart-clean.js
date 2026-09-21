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
    console.log("\n--- FORCE KILLING ALL USER NODE PROCESSES AND STARTING FRESH ---");

    const killAndStartScript = `
      # Find all node PIDs for this user and kill them
      for pid in $(ps -u u375327955 -o pid,comm | grep node | awk '{print $1}'); do
        echo "Killing PID $pid..."
        kill -9 $pid 2>/dev/null || true
      done

      sleep 2

      echo "Remaining node processes:"
      ps aux | grep node | grep -v grep || true

      cd /home/u375327955/pqn-app
      
      # Start fresh on 3090
      PORT=3090 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      
      sleep 4

      echo "=== New Process & Log ==="
      ps aux | grep node | grep -v grep || true
      cat app.log 2>&1 || true

      echo "=== Testing Admin Login API ==="
      curl -s -i -X POST http://127.0.0.1:3090/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    const res = await runCommand(killAndStartScript);
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
