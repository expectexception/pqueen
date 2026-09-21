const { Client } = require('ssh2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready. Locating and uploading authorized-signature...');

  // Upload local SVG directly to remote directories
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localSvg = path.join(__dirname, '..', 'public', 'images', 'authorized-signature.svg');
    const remoteAppSvg = '/home/u375327955/pqn-app/public/authorized-signature.svg';
    const remoteAppImgSvg = '/home/u375327955/pqn-app/public/images/authorized-signature.svg';
    const remoteHtmlSvg = '/home/u375327955/domains/pqnpartyqueen.com/public_html/authorized-signature.svg';
    const remoteHtmlImgDir = '/home/u375327955/domains/pqnpartyqueen.com/public_html/images';
    const remoteHtmlImgSvg = '/home/u375327955/domains/pqnpartyqueen.com/public_html/images/authorized-signature.svg';

    conn.exec(`mkdir -p /home/u375327955/pqn-app/public/images ${remoteHtmlImgDir}`, (mkErr) => {
      sftp.fastPut(localSvg, remoteAppSvg, () => {
        sftp.fastPut(localSvg, remoteAppImgSvg, () => {
          sftp.fastPut(localSvg, remoteHtmlSvg, () => {
            sftp.fastPut(localSvg, remoteHtmlImgSvg, () => {
              console.log('✓ Signature SVG uploaded to all public and app paths!');
              conn.end();
            });
          });
        });
      });
    });
  });
}).connect({
  host: process.env.SSH_HOST || '82.25.107.10',
  port: parseInt(process.env.SSH_PORT || '65002', 10),
  username: process.env.SSH_USER || 'u375327955',
  password: process.env.SSH_PASS
});
