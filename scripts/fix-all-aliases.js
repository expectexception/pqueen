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
    console.log("\n--- LINKING ALL TURBOPACK HASHED MODULES ON SERVER ---");

    const fixScript = `
      cd /home/u375327955/pqn-app
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH

      mkdir -p .next/node_modules/@prisma

      # Link all hashed module aliases in both root node_modules and .next/node_modules
      ln -sfn /home/u375327955/pqn-app/node_modules/bcryptjs .next/node_modules/bcryptjs-ee66c2bdc904f2cf
      ln -sfn /home/u375327955/pqn-app/node_modules/bcryptjs node_modules/bcryptjs-ee66c2bdc904f2cf

      ln -sfn /home/u375327955/pqn-app/node_modules/@prisma/adapter-pg .next/node_modules/@prisma/adapter-pg-994324666b79ccf3
      ln -sfn /home/u375327955/pqn-app/node_modules/@prisma/adapter-pg node_modules/@prisma/adapter-pg-994324666b79ccf3

      ln -sfn /home/u375327955/pqn-app/node_modules/@prisma/client .next/node_modules/@prisma/client-2c3a283f134fdcb6
      ln -sfn /home/u375327955/pqn-app/node_modules/@prisma/client node_modules/@prisma/client-2c3a283f134fdcb6

      ln -sfn /home/u375327955/pqn-app/node_modules/pg .next/node_modules/pg-587764f78a6c7a9c
      ln -sfn /home/u375327955/pqn-app/node_modules/pg node_modules/pg-587764f78a6c7a9c

      # Verify require works
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        require('bcryptjs-ee66c2bdc904f2cf');
        require('@prisma/adapter-pg-994324666b79ccf3');
        require('@prisma/client-2c3a283f134fdcb6');
        console.log('✓ All Turbopack hashed aliases verified successfully!');
      "

      # Kill old server instances
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const fs = require('fs');
        const pids = fs.readdirSync('/proc').filter(f => /^\\\\d+$/.test(f));
        for (const pid of pids) {
          try {
            const cmd = fs.readFileSync('/proc/' + pid + '/cmdline', 'utf8');
            if (cmd.includes('server.js')) {
              if (pid != process.pid) {
                console.log('Killing PID:', pid);
                process.kill(Number(pid), 'SIGKILL');
              }
            }
          } catch(e) {}
        }
      "

      sleep 2
      rm -f app.log

      # Get free port
      FREE_PORT=$(/opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const net = require('net');
        const s = net.createServer();
        s.listen(0, '127.0.0.1', () => {
          console.log(s.address().port);
          s.close();
        });
      ")
      echo "Starting on Free Port: $FREE_PORT"

      # Update PHP reverse proxy
      cat << EOF > /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php
<?php
\$backend = 'http://127.0.0.1:' . '$FREE_PORT';
\$reqUri = \$_SERVER['REQUEST_URI'];
\$url = \$backend . \$reqUri;

\$ch = curl_init(\$url);
\$headers = [];
foreach (getallheaders() as \$key => \$value) {
    if (strtolower(\$key) !== 'host') {
        \$headers[] = "\$key: \$value";
    }
}
\$headers[] = 'Host: ' . \$_SERVER['HTTP_HOST'];
\$headers[] = 'X-Forwarded-For: ' . (isset(\$_SERVER['HTTP_X_FORWARDED_FOR']) ? \$_SERVER['HTTP_X_FORWARDED_FOR'] : \$_SERVER['REMOTE_ADDR']);
\$headers[] = 'X-Forwarded-Proto: ' . (isset(\$_SERVER['HTTPS']) && \$_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
\$headers[] = 'X-Real-IP: ' . \$_SERVER['REMOTE_ADDR'];

curl_setopt(\$ch, CURLOPT_HTTPHEADER, \$headers);
curl_setopt(\$ch, CURLOPT_CUSTOMREQUEST, \$_SERVER['REQUEST_METHOD']);

if (in_array(\$_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    \$input = file_get_contents('php://input');
    curl_setopt(\$ch, CURLOPT_POSTFIELDS, \$input);
}

curl_setopt(\$ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt(\$ch, CURLOPT_HEADER, true);
curl_setopt(\$ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt(\$ch, CURLOPT_TIMEOUT, 60);

\$response = curl_exec(\$ch);

if (\$response === false) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><body style="background:#072818;color:#f5d77f;text-align:center;padding:60px;"><h2>PQN Atelier Initializing...</h2></body></html>';
    curl_close(\$ch);
    exit;
}

\$header_size = curl_getinfo(\$ch, CURLINFO_HEADER_SIZE);
\$http_code = curl_getinfo(\$ch, CURLINFO_HTTP_CODE);
\$header_text = substr(\$response, 0, \$header_size);
\$body = substr(\$response, \$header_size);
curl_close(\$ch);

http_response_code(\$http_code);

foreach (explode("\\r\\n", \$header_text) as \$header_line) {
    if (!empty(\$header_line) && !preg_match('/^HTTP\\//i', \$header_line) && !preg_match('/^Transfer-Encoding:/i', \$header_line)) {
        header(\$header_line, false);
    }
}

echo \$body;
EOF

      PORT=$FREE_PORT HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app.log 2>&1 < /dev/null &
      sleep 4

      echo "=== Testing Admin Login API on $FREE_PORT ==="
      curl -s -i -X POST http://127.0.0.1:$FREE_PORT/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `;

    const res = await runCommand(fixScript);
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
