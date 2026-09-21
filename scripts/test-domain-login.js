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
    console.log("\n--- TESTING ADMIN LOGIN DIRECTLY VIA HTTPS DOMAIN ---");

    const testDomain = await runCommand(`
      # Check proxy target in index.php
      head -n 5 /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php

      # Test Admin Login through domain
      curl -s -i -X POST https://pqnpartyqueen.com/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `);
    console.log("Domain Login Response:\n", testDomain.stdout, testDomain.stderr);

    // Also check app.log
    const checkLog = await runCommand("tail -n 25 /home/u375327955/pqn-app/app.log");
    console.log("\nApp Log:\n", checkLog.stdout);

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
