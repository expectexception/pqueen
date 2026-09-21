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

    console.log("\n--- INSTALLING SELF-HEALING INDEX.PHP PROXY ---");
    const script = `
      cat << 'EOF' > /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php
<?php
// PQN Party Queen - High-Performance Self-Healing Reverse Proxy Bridge
$backendPort = 34849;
$backend = "http://127.0.0.1:$backendPort";
$nodeBinary = '/opt/alt/alt-nodejs22/root/usr/bin/node';
$appDir = '/home/u375327955/pqn-app';

function isServerRunning($port) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.3);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

function spawnServer($nodeBinary, $appDir, $port) {
    // Only spawn if not already running
    $cmd = "cd $appDir && PORT=$port HOSTNAME=127.0.0.1 setsid $nodeBinary server.js >> app.log 2>&1 < /dev/null &";
    @exec($cmd);
}

// Auto-heal / auto-spawn if node process was stopped
if (!isServerRunning($backendPort)) {
    spawnServer($nodeBinary, $appDir, $backendPort);
    // Wait briefly for port to accept connections
    for ($i = 0; $i < 20; $i++) {
        usleep(150000); // 150ms
        if (isServerRunning($backendPort)) break;
    }
}

$reqUri = $_SERVER['REQUEST_URI'];
$url = $backend . $reqUri;
$isStatic = strpos($reqUri, '/_next/static/') === 0;

function executeCurl($targetUrl) {
    $ch = curl_init($targetUrl);
    $headers = [];
    $hasContentType = false;
    $hasCookie = false;

    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $key => $value) {
            $lowerKey = strtolower($key);
            if ($lowerKey !== 'host' && $lowerKey !== 'content-length') {
                if ($lowerKey === 'content-type') $hasContentType = true;
                if ($lowerKey === 'cookie') $hasCookie = true;
                $headers[] = "$key: $value";
            }
        }
    }

    if (!$hasContentType && isset($_SERVER['CONTENT_TYPE']) && !empty($_SERVER['CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
    }
    if (!$hasCookie && isset($_SERVER['HTTP_COOKIE']) && !empty($_SERVER['HTTP_COOKIE'])) {
        $headers[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
    }

    $headers[] = 'Host: ' . $_SERVER['HTTP_HOST'];
    $headers[] = 'X-Forwarded-For: ' . (isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR']);
    $headers[] = 'X-Forwarded-Proto: https';
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

    $resp = curl_exec($ch);
    $err = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    return [$resp, $err, $info];
}

list($response, $curlError, $info) = executeCurl($url);

if ($response === false || (isset($info['http_code']) && $info['http_code'] === 0)) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><body style="background:#072818;color:#f5d77f;text-align:center;padding:60px;font-family:sans-serif;"><h2>PQN Atelier Server Starting...</h2><p>Please refresh in 2 seconds.</p></body></html>';
    exit;
}

$header_size = $info['header_size'];
$http_code = $info['http_code'];
$header_text = substr($response, 0, $header_size);
$body = substr($response, $header_size);

http_response_code($http_code);

$lines = preg_split("/\r?\n/", $header_text);
foreach ($lines as $header_line) {
    $header_line = trim($header_line);
    if (!empty($header_line)
        && !preg_match('#^HTTP/#i', $header_line)
        && !preg_match('#^Transfer-Encoding:#i', $header_line)
        && !preg_match('#^Cache-Control:#i', $header_line)
        && !preg_match('#^Pragma:#i', $header_line)
        && !preg_match('#^Expires:#i', $header_line)
    ) {
        header($header_line, false);
    }
}

if ($isStatic) {
    header("Cache-Control: public, max-age=31536000, immutable", true);
} else {
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0", true);
    header("Pragma: no-cache", true);
    header("Expires: Thu, 01 Jan 1970 00:00:00 GMT", true);
}

echo $body;
EOF

      echo "=== VERIFYING LIVE DOMAIN ==="
      curl -s -k -I https://pqnpartyqueen.com/
      curl -s -k -I https://pqnpartyqueen.com/shop
      curl -s -k -I https://pqnpartyqueen.com/admin/login
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
