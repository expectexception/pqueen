const { Client } = require('ssh2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Successful!');
  const cmd = `
    echo "=== 1. PROCESS STATUS ==="
    ps -u u375327955 -o pid,ppid,%cpu,%mem,cmd | grep -E "server|node" | grep -v grep || echo "No server process running"

    echo "=== 2. PORT 34849 CHECK ==="
    ${process.env.SSH_NODE_PATH || '/opt/alt/alt-nodejs22/root/usr/bin'}/node -e '
      fetch("http://127.0.0.1:34849/api/settings/public")
        .then(r => r.json())
        .then(d => console.log("Direct Port Response:", JSON.stringify(d, null, 2)))
        .catch(e => console.log("Direct Port Error:", e.message));
    '

    echo "=== 3. RECENT APP LOG ==="
    tail -n 35 /home/u375327955/pqn-app/app.log 2>/dev/null || echo "No app.log"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: process.env.SSH_HOST || '82.25.107.10',
  port: parseInt(process.env.SSH_PORT || '65002', 10),
  username: process.env.SSH_USER || 'u375327955',
  password: process.env.SSH_PASS
});
