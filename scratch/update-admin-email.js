require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Updating admin email to thep4rtyqueen@gmail.com...");
  const admin = await prisma.admin.findFirst();
  if (admin) {
    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        email: "thep4rtyqueen@gmail.com",
        name: "PQN Master Administrator",
      },
    });
    console.log("Admin record successfully updated in database:", updated);
  } else {
    console.log("No admin found to update.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
