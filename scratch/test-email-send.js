require("dotenv/config");
const nodemailer = require("nodemailer");

async function main() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = (process.env.SMTP_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  console.log("Sending test email to thep4rtyqueen@gmail.com...");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: `"PQN PARTY QUEEN" <${user}>`,
    to: "thep4rtyqueen@gmail.com",
    subject: "PQN Admin Security Passcode [TEST]: 849201",
    text: "Your PQN Party Queen admin password reset OTP is 849201. Valid for 5 minutes.",
    html: `
      <div style="font-family: sans-serif; padding: 20px; background: #072818; color: #fff; border-radius: 8px;">
        <h2 style="color: #f5d77f;">PQN Party Queen Admin Security Passcode</h2>
        <p>Use the following 6-digit verification code to reset your administrator password:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #f5d77f; padding: 15px 0;">849201</div>
        <p style="color: #ccc; font-size: 12px;">Valid for 5 minutes. If you did not request this, please secure your account immediately.</p>
      </div>
    `,
  });

  console.log("Email sent successfully! MessageId:", info.messageId);
}

main().catch(console.error);
