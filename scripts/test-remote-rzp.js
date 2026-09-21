const { Client } = require("ssh2");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const conn = new Client();
conn.on("ready", () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const script = `
      const Razorpay = require("/home/u375327955/pqn-app/node_modules/razorpay");
      require("dotenv").config({ path: "/home/u375327955/pqn-app/.env" });
      console.log("ENV_KEY_ID:", process.env.RAZORPAY_KEY_ID);
      console.log("ENV_SECRET:", JSON.stringify(process.env.RAZORPAY_KEY_SECRET));
      const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TaoMLTuhSegZCy", key_secret: process.env.RAZORPAY_KEY_SECRET || "MLB4emshWk4v8t2bvLo5G6xg" });
      rzp.orders.create({ amount: 50000, currency: "INR", receipt: "test_rcpt_1" })
        .then(d => console.log("RZP SUCCESS:", d.id))
        .catch(e => console.log("RZP ERROR:", JSON.stringify(e)));
    `;
    
    const ws = sftp.createWriteStream("/home/u375327955/test-rzp.js");
    ws.write(script);
    ws.end(() => {
      conn.exec("/opt/alt/alt-nodejs22/root/usr/bin/node /home/u375327955/test-rzp.js", (err, stream) => {
        if (err) throw err;
        stream.on("data", d => process.stdout.write(d));
        stream.stderr.on("data", d => process.stderr.write(d));
        stream.on("close", () => conn.end());
      });
    });
  });
}).connect({
  host: process.env.SSH_HOST || "82.25.107.10",
  port: parseInt(process.env.SSH_PORT || "65002", 10),
  username: process.env.SSH_USER || "u375327955",
  password: process.env.SSH_PASS
});
