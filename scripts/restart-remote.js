const { Client } = require('ssh2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Successful! Safe-restarting Node daemon...');

  // Target ONLY the PID listening on port 34849
  const cmd = `
    PID=$(lsof -ti:34849 2>/dev/null || fuser 34849/tcp 2>/dev/null | tr -d ' ' || true)
    if [ ! -z "$PID" ]; then
      echo "Killing old server process $PID"
      kill -9 $PID 2>/dev/null || true
    fi
    sleep 2

    APP_DIR="/home/u375327955/pqn-app"
    NODE_BIN="/opt/alt/alt-nodejs22/root/usr/bin"

    cat << 'STARTEOF' > $APP_DIR/run.sh
#!/bin/bash
export PATH="/opt/alt/alt-nodejs22/root/usr/bin:$PATH"
export PORT=34849
export HOSTNAME=0.0.0.0
export NODE_ENV=production
cd /home/u375327955/pqn-app
nohup /opt/alt/alt-nodejs22/root/usr/bin/node server.js > /home/u375327955/pqn-app/app.log 2>&1 &
STARTEOF

    chmod +x $APP_DIR/run.sh
    bash $APP_DIR/run.sh
    sleep 3

    echo "=== SERVER STARTUP STATUS ==="
    $NODE_BIN/node -e '
      fetch("http://127.0.0.1:34849/api/settings/public")
        .then(r => r.json())
        .then(d => console.log("✓ LIVE API OK:", JSON.stringify(d, null, 2)))
        .catch(e => console.error("API ERROR:", e.message));
    '
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d.toString()))
          .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({
  host: process.env.SSH_HOST || '82.25.107.10',
  port: parseInt(process.env.SSH_PORT || '65002', 10),
  username: process.env.SSH_USER || 'u375327955',
  password: process.env.SSH_PASS
});
