require("dotenv/config");
const { sendOtpEmail } = require("../lib/email");

async function main() {
  console.log("Testing OTP email to thep4rtyqueen@gmail.com...");
  const res = await sendOtpEmail({
    email: "thep4rtyqueen@gmail.com",
    name: "PQN Administrator",
    otp: "849201",
    purpose: "ADMIN_FORGOT_PASSWORD",
  });
  console.log("sendOtpEmail Result:", res);
}

main().catch(console.error);
