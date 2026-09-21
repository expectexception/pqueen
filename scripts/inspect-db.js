require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const adminCount = await prisma.admin.count();
    const admins = await prisma.admin.findMany({ select: { id: true, email: true, name: true } });
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const orderCount = await prisma.order.count();
    const customerCount = await prisma.customer.count();
    const bcrypt = require("bcryptjs");
    const superAdmin = await prisma.admin.findUnique({ where: { email: "admin@pqnpartyqueen.com" } });
    const superAdminOk = superAdmin ? await bcrypt.compare("Admin@12345", superAdmin.passwordHash) : false;
    const customer = await prisma.customer.findUnique({ where: { email: "customer@pqnpartyqueen.com" } });
    const customerOk = customer ? await bcrypt.compare("Customer@12345", customer.passwordHash) : false;
    console.log("DATABASE_STATUS: CONNECTED");
    console.log("Counts:", { adminCount, productCount, categoryCount, orderCount, customerCount });
    console.log("SuperAdmin Login Valid:", superAdminOk, "Customer Login Valid:", customerOk);
    console.log("Admins in DB:", admins);
  } catch (err) {
    console.error("DATABASE_ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
