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
    console.log("\n--- TESTING PHP REVERSE PROXY BRIDGE ---");

    const setupPhpBridge = await runCommand(`
      cat << 'EOF' > /home/u375327955/domains/pqnpartyqueen.com/public_html/index.php
<?php
$backend = 'http://127.0.0.1:3050';
$url = $backend . $_SERVER['REQUEST_URI'];

$ch = curl_init($url);
$headers = [];
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host') {
        $headers[] = "$key: $value";
    }
}
$headers[] = 'Host: ' . $_SERVER['HTTP_HOST'];
$headers[] = 'X-Forwarded-For: ' . $_SERVER['REMOTE_ADDR'];
$headers[] = 'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/html; charset=utf-8');
    echo '<html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>PQN Atelier Starting Up...</h2><p>Our Node.js engine is initializing. Please refresh in a moment.</p></body></html>';
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

      cat << 'EOF' > /home/u375327955/domains/pqnpartyqueen.com/public_html/.htaccess
DirectoryIndex index.php
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
EOF
    `);
    console.log("PHP bridge & .htaccess created:\n", setupPhpBridge.stdout);

    const testProxyLive = await runCommand(`
      export PATH=/opt/alt/alt-nodejs22/root/usr/bin:~/.npm-global/bin:$PATH
      /opt/alt/alt-nodejs22/root/usr/bin/node -e "
        const http = require('http');
        const server = http.createServer((req, res) => {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end('<h1>✨ PQN PARTY QUEEN HAUTE COUTURE LIVE FROM HOSTINGER VIA NODE 22! ✨</h1><p>Url: ' + req.url + '</p>');
        });
        server.listen(3050, '127.0.0.1', () => {
          console.log('Node active on 3050');
          setTimeout(() => process.exit(0), 12000);
        });
      " &
      sleep 2
      curl -s -k https://pqnpartyqueen.com/shop?cat=lehengas
    `);
    console.log("Live domain response:\n", testProxyLive.stdout, testProxyLive.stderr);

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
