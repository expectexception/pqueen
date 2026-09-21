import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name =
    process.env.ADMIN_NAME?.trim() || "PQN Admin";

  if (!email) {
    throw new Error("ADMIN_EMAIL is missing.");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD is missing.");
  }

  if (password.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 8 characters long."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: {
      email,
    },
    update: {
      name,
      passwordHash,
    },
    create: {
      name,
      email,
      passwordHash,
    },
  });

  console.log("Admin account created/updated successfully.");
  console.log("Admin ID:", admin.id);
  console.log("Admin email:", admin.email);
}

main()
  .catch((error) => {
    console.error("CREATE ADMIN ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });