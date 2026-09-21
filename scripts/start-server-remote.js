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
    console.log("\n--- STARTING WITH SETSID DETACHED PROCESS ---");

    const startCmd = await runCommand(`
      cd /home/u375327955/pqn-app
      
      # Kill old instances
      killall node 2>/dev/null || true
      sleep 1
      
      # Launch fully detached with setsid
      PORT=3050 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      
      sleep 3
      
      cat app.log 2>&1 || true
      ps aux | grep "node server.js" | grep -v grep || true
    `);
    console.log("Start output:\n", startCmd.stdout, startCmd.stderr);

    // Test local curl
    const testLocal = await runCommand("curl -s -I http://127.0.0.1:3050");
    console.log("\nLocal HTTP 3050 headers:\n", testLocal.stdout);

    // Test live domain
    const testDomain = await runCommand("curl -s -k https://pqnpartyqueen.com | head -n 45");
    console.log("\nLive Domain response (https://pqnpartyqueen.com):\n", testDomain.stdout);

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
