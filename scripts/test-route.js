require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log('Altering Order table to add payment columns...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Order" 
    ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'PREPAID',
    ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'PAID',
    ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT,
    ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;
  `);

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'Order'
    ORDER BY ordinal_position;
  `);
  console.log('Order table columns:');
  console.table(cols);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

