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
    console.log("\n--- FINDING AND KILLING ANY PORT 3090 PROCESS ---");

    // 1. Temporarily disable autospawn in index.php while we debug
    const disableSpawn = await runCommand(`
      cat << 'EOF' > /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php
<?php
$backend = 'http://127.0.0.1:3090';
$reqUri = $_SERVER['REQUEST_URI'];
$url = $backend . $reqUri;

$ch = curl_init($url);
$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}
$headers[] = 'Host: ' . $_SERVER['HTTP_HOST'];
$headers[] = 'X-Forwarded-For: ' . (isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR']);
$headers[] = 'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
$headers[] = 'X-Real-IP: ' . $_SERVER['REMOTE_ADDR'];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><body><h1>Starting...</h1></body></html>';
    curl_close($ch);
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$header_text = substr($response, 0, $header_size);
$body = substr($response, $header_size);
curl_close($ch);

http_response_code($http_code);

foreach (explode("\r\n", $header_text) as $header_line) {
    if (!empty($header_line) && !preg_match('/^HTTP\//i', $header_line) && !preg_match('/^Transfer-Encoding:/i', $header_line)) {
        header($header_line, false);
    }
}

echo $body;
EOF
    `);

    // 2. Kill all node processes
    await runCommand(`
      for pid in $(ps -u u375327955 -o pid,comm | grep node | awk '{print $1}'); do
        kill -9 $pid 2>/dev/null || true
      done
      sleep 2
    `);

    // 3. Start node in background with fresh clean log
    const startRes = await runCommand(`
      cd /home/u375327955/pqn-app
      rm -f app-clean.log
      PORT=3090 HOSTNAME=127.0.0.1 setsid /opt/alt/alt-nodejs22/root/usr/bin/node server.js > app-clean.log 2>&1 < /dev/null &
      sleep 4
      cat app-clean.log
    `);
    console.log("Server Start:\n", startRes.stdout);

    // 4. Test login API directly
    const loginTest = await runCommand(`
      curl -s -i -X POST http://127.0.0.1:3090/api/admin/login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"P4RTYqueen@gmail.com","password":"Karan@123"}'
    `);
    console.log("Login Test Response:\n", loginTest.stdout);

    // 5. Check log immediately after login call
    const logCheck = await runCommand("cat /home/u375327955/pqn-app/app-clean.log");
    console.log("App log after login:\n", logCheck.stdout);

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
