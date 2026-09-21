require("dotenv/config");

async function main() {
  console.log("Testing POST /api/auth/otp/send for ADMIN_FORGOT_PASSWORD...");
  const { createAndSendOtp } = require("../lib/otp");

  const result = await createAndSendOtp({
    identifier: "thep4rtyqueen@gmail.com",
    purpose: "ADMIN_FORGOT_PASSWORD",
    name: "PQN Master Administrator",
  });

  console.log("createAndSendOtp result:", result);
}

main().catch(console.error);
