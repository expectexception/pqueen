const { Client } = require("ssh2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const conn = new Client();

const config = {
  host: process.env.SSH_HOST || "82.25.107.10",
  port: parseInt(process.env.SSH_PORT || "65002", 10),
  username: process.env.SSH_USER || "u375327955",
  password: process.env.SSH_PASS || "Part2Part@420",
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
    console.log("SSH Connection Successful!");

    console.log("\n--- 1. CLEANING OLD PROCESSES & CONFIGURING WATCHDOG ---");
    const script = `
      # Kill any stale node server processes
      killall node 2>/dev/null || true
      sleep 1

      # Create watchdog script for PORT 34849
      cat << 'EOF' > /home/u375327955/pqn-app/watchdog.sh
#!/bin/bash
if ! /opt/alt/alt-nodejs22/root/usr/bin/node -e 'fetch("http://127.0.0.1:34849/api/settings/public").then(r=>process.exit(0)).catch(e=>process.exit(1))' >/dev/null 2>&1; then
    echo "[$(date)] Port 34849 unresponsive. Starting Next.js daemon..." >> /home/u375327955/pqn-app/watchdog.log
    killall node 2>/dev/null || true
    sleep 1
    cd /home/u375327955/pqn-app
    PORT=34849 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js >> /home/u375327955/pqn-app/app.log 2>&1 < /dev/null &
fi
EOF

      chmod +x /home/u375327955/pqn-app/watchdog.sh

      # Setup crontab to check every 1 minute and @reboot
      (crontab -l 2>/dev/null | grep -v 'watchdog.sh' ; echo '* * * * * /home/u375327955/pqn-app/watchdog.sh > /dev/null 2>&1'; echo '@reboot /home/u375327955/pqn-app/watchdog.sh > /dev/null 2>&1') | crontab -

      # Start server now
      cd /home/u375327955/pqn-app
      PORT=34849 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js >> /home/u375327955/pqn-app/app.log 2>&1 < /dev/null &

      sleep 4

      echo "=== ACTIVE PROCESSES ==="
      ps -u u375327955 -o pid,ppid,%cpu,%mem,cmd | grep -E "node|server" | grep -v grep || echo "No processes found"

      echo "=== PORT 34849 TEST ==="
      curl -s -I http://127.0.0.1:34849/

      echo "=== LIVE DOMAIN TEST ==="
      curl -s -k -I https://pqnpartyqueen.com/
    `;

    const res = await runCommand(script);
    console.log("Output:\n", res.stdout);
    if (res.stderr) console.error("Errors:\n", res.stderr);

  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    conn.end();
  }
});

conn.on("error", (err) => {
  console.error("SSH Error:", err);
});

conn.connect(config);
