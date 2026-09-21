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
    console.log("\n--- UPDATING PHP BRIDGE WITH SELF-HEALING AUTO-SPAWN ---");

    const phpBridgeCode = `
      cat << 'EOF' > /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php
<?php
// PQN Party Queen - High-Performance Self-Healing Reverse Proxy Bridge
$backend = 'http://127.0.0.1:3050';
$nodeBinary = '/opt/alt/alt-nodejs22/root/usr/bin/node';
$appDir = '/home/u375327955/pqn-app';

function isServerRunning() {
    $fp = @fsockopen('127.0.0.1', 3050, $errno, $errstr, 0.4);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

function spawnServer($nodeBinary, $appDir) {
    $cmd = "cd $appDir && PORT=3050 HOSTNAME=127.0.0.1 setsid $nodeBinary server.js >> app.log 2>&1 < /dev/null &";
    exec($cmd);
}

// Check & auto-heal if server is not responding
if (!isServerRunning()) {
    spawnServer($nodeBinary, $appDir);
    // Wait up to 3 seconds for boot
    for ($i = 0; $i < 15; $i++) {
        usleep(200000); // 200ms
        if (isServerRunning()) break;
    }
}

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
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>PQN Party Queen - Initializing</title></head><body style="background:#072818;color:#f5d77f;font-family:Georgia,serif;text-align:center;padding:80px 20px;"><h1 style="font-size:28px;letter-spacing:3px;">PQN PARTY QUEEN</h1><p style="color:#fff;font-size:14px;">Atelier Engine Initializing. Please refresh in a moment...</p></body></html>';
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
    `;

    await runCommand(phpBridgeCode);
    console.log("✓ Self-healing PHP bridge configured!");

    const testFinal = await runCommand("curl -s -k -I https://pqnpartyqueen.com");
    console.log("Final Health check:\n", testFinal.stdout);

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
