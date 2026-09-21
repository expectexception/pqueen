require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const admins = await prisma.admin.findMany();
  console.log("Admins in DB:", admins);

  const nodemailer = require("nodemailer");
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = (process.env.SMTP_USER || "").trim();
  const rawPass = (process.env.SMTP_PASS || "").trim();
  const pass = rawPass.replace(/\s+/g, "");

  console.log("Testing SMTP connection with:", { host, port, user, passLength: pass.length });

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    console.log("SMTP Connection verified successfully!");
  } catch (err) {
    console.error("SMTP Verify Failed:", err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
