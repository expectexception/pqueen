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
    console.log("\n--- SETTING UP PERSISTENT WATCHDOG CRON ---");

    const setupWatchdog = `
      cat << 'EOF' > /home/u375327955/pqn-app/watchdog.sh
#!/bin/bash
if ! pgrep -f "node server.js" > /dev/null; then
    echo "[$(date)] Next.js server was not running. Restarting..." >> /home/u375327955/pqn-app/watchdog.log
    cd /home/u375327955/pqn-app
    PORT=3050 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js >> /home/u375327955/pqn-app/app.log 2>&1 < /dev/null &
fi
EOF

      chmod +x /home/u375327955/pqn-app/watchdog.sh
      
      # Add to crontab (run every 2 minutes and @reboot)
      (crontab -l 2>/dev/null | grep -v 'watchdog.sh' ; echo '*/2 * * * * /home/u375327955/pqn-app/watchdog.sh > /dev/null 2>&1'; echo '@reboot /home/u375327955/pqn-app/watchdog.sh > /dev/null 2>&1') | crontab -
      
      crontab -l
    `;

    const res = await runCommand(setupWatchdog);
    console.log("Watchdog crontab output:\n", res.stdout, res.stderr);

    console.log("\n--- VERIFYING LIVE STORE PAGES ---");
    const testHome = await runCommand("curl -s -k -I https://pqnpartyqueen.com");
    console.log("Homepage:\n", testHome.stdout);

    const testShop = await runCommand("curl -s -k -I https://pqnpartyqueen.com/shop");
    console.log("Shop Page:\n", testShop.stdout);

    const testAdmin = await runCommand("curl -s -k -I https://pqnpartyqueen.com/admin/login");
    console.log("Admin Login:\n", testAdmin.stdout);

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
