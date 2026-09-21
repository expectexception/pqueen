const { Client } = require('ssh2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Successful! Syncing public assets to public_html...');

  const cmd = `
    cp -r /home/u375327955/pqn-app/public/* /home/u375327955/domains/pqnpartyqueen.com/public_html/ 2>/dev/null || true
    echo "=== PUBLIC ASSETS IN PUBLIC_HTML ==="
    ls -la /home/u375327955/domains/pqnpartyqueen.com/public_html/ | grep -E "svg|png|images" || true
    ls -la /home/u375327955/domains/pqnpartyqueen.com/public_html/images 2>/dev/null || true
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
