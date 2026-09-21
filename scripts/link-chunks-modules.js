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
    console.log("\n--- LINKING NODE_MODULES INTO CHUNKS DIR & TESTING LOGIN ---");

    const linkScript = `
      cd /home/u375327955/pqn-app
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

      # Link root node_modules into .next/server/chunks/node_modules and .next/server/node_modules
      ln -sfn /home/u375327955/pqn-app/node_modules /home/u375327955/pqn-app/.next/server/chunks/node_modules
      ln -sfn /home/u375327955/pqn-app/node_modules /home/u375327955/pqn-app/.next/server/node_modules

      # Kill old server
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const fs = require('fs');
        const pids = fs.readdirSync('/proc').filter(f => /^\\\\d+$/.test(f));
        for (const pid of pids) {
          try {
            const cmd = fs.readFileSync('/proc/' + pid + '/cmdline', 'utf8');
            if (cmd.includes('server.js')) {
              if (pid != process.pid) {
                console.log('Terminating PID:', pid);
                process.kill(Number(pid), 'SIGKILL');
              }
            }
          } catch(e) {}
        }
      "

      sleep 2
      rm -f app.log

      PORT=29689 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      sleep 4

      echo "=== Testing Admin Login via Domain ==="
      curl -s -i -X POST https://pqnpartyqueen.com/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    const res = await runCommand(linkScript);
    console.log("Output:\n", res.stdout, res.stderr);

    const logCheck = await runCommand("tail -n 25 /home/u375327955/pqn-app/app.log");
    console.log("App Log:\n", logCheck.stdout);

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
