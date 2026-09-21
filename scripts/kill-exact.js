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
    console.log("\n--- PRECISE NODE PROCESS TERMINATOR & FRESH BOOT ---");

    const killScript = `
      cd /home/u375327955/pqn-app
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

      # 1. Kill all old server.js instances via /proc inspection
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const fs = require('fs');
        const pids = fs.readdirSync('/proc').filter(f => /^\\\\d+$/.test(f));
        let killed = 0;
        for (const pid of pids) {
          try {
            const cmd = fs.readFileSync('/proc/' + pid + '/cmdline', 'utf8');
            if (cmd.includes('server.js')) {
              if (pid != process.pid) {
                console.log('Terminating old server PID:', pid);
                process.kill(Number(pid), 'SIGKILL');
                killed++;
              }
            }
          } catch(e) {}
        }
        console.log('Total terminated processes:', killed);
      "

      sleep 2
      rm -f app.log

      # 2. Start server fresh
      PORT=35892 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      sleep 4

      echo "=== Fresh App Log ==="
      cat app.log 2>&1 || true

      echo "=== Testing Admin Login API ==="
      curl -s -i -X POST http://127.0.0.1:35892/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    const res = await runCommand(killScript);
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
