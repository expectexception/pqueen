import { ShippingEngine } from '../lib/shipping/engine';
import { prisma } from '../lib/prisma';

async function testFullFlow() {
  console.log('=== STEP 1: INITIALIZE SHIPPING ENGINE ===');
  const engine = ShippingEngine.getInstance();
  engine.reload();

  const settings = engine.getSettings();
  console.log('Primary Provider:', settings.primaryProvider);
  console.log('iThink Enabled:', settings.providers.ithink?.enabled);
  console.log('iThink Connected:', settings.providers.ithink?.connected);

  console.log('\n=== STEP 2: TEST PROVIDER CONNECTION ===');
  const testConn = await engine.testProviderConnection('ithink');
  console.log('Test Connection Result:', testConn);

  console.log('\n=== STEP 3: GET LIVE SHIPPING QUOTES ===');
  const quotesRes = await engine.getQuotes({
    deliveryPincode: '110059',
    weightKg: 0.8,
    isCod: false,
    orderValue: 2999
  });
  console.log('Quotes Count:', quotesRes.quotes.length);
  quotesRes.quotes.forEach(q => {
    console.log(` - ${q.courierName}: ₹${q.totalCharge} (${q.estimatedDeliveryDays} days) [${q.providerName}]`);
  });

  console.log('\n=== STEP 4: FIND AN ORDER OR CREATE A REAL TEST ORDER ===');
  let order = await prisma.order.findFirst({
    where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
    include: { items: true, customer: true }
  });

  if (!order) {
    console.log('No existing order found. Creating test customer and order...');
    let customer = await prisma.customer.findFirst();
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: 'Priyanka Sharma',
          email: 'priyanka.test@pqnpartyqueen.com',
          phone: '9958907429'
        }
      });
    }

    let product = await prisma.product.findFirst();
    if (!product) {
      const category = await prisma.category.create({
        data: {
          name: 'Bridal Couture',
          slug: 'bridal-couture-' + Date.now()
        }
      });
      product = await prisma.product.create({
        data: {
          name: 'Handcrafted Zardozi Silk Lehenga',
          slug: 'zardozi-silk-lehenga-' + Date.now(),
          sku: 'PQN-LEH-' + Date.now(),
          price: 4999.00,
          categoryId: category.id
        }
      });
    }

    order = await prisma.order.create({
      data: {
        orderNumber: 'PQN-TEST-' + Date.now(),
        customerId: customer.id,
        totalAmount: 4999.00,
        shippingName: 'Priyanka Sharma',
        shippingPhone: '9958907429',
        shippingAddress: 'WZ 147 A D Block 2 Uttam Nagar',
        shippingCity: 'New Delhi',
        shippingState: 'Delhi',
        shippingPincode: '110059',
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID',
        status: 'PENDING',
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              size: 'M',
              color: 'Crimson Gold',
              quantity: 1,
              price: 4999.00
            }
          ]
        }
      },
      include: { items: true, customer: true }
    });
  }

  console.log(`Order to fulfill: #${order.orderNumber} (ID: ${order.id})`);

  console.log('\n=== STEP 5: TRIGGER LIVE AUTOFULFILL VIA ITHINK LOGISTICS ===');
  const fulfillment = await engine.autoFulfillOrder(order.id);
  console.log('Fulfillment Result:', JSON.stringify(fulfillment, null, 2));

  console.log('\n=== STEP 6: VERIFY DATABASE ORDER RECORD ===');
  const updatedOrder = await prisma.order.findUnique({
    where: { id: order.id }
  });

  console.log('DB Order Record:');
  console.log(' - Status:', updatedOrder?.status);
  console.log(' - Shipping Status:', updatedOrder?.shippingStatus);
  console.log(' - AWB Number:', updatedOrder?.awbNumber);
  console.log(' - Courier Name:', updatedOrder?.courierName);
  console.log(' - Tracking URL:', updatedOrder?.trackingUrl);
  console.log(' - Label URL:', updatedOrder?.shippingLabelUrl);
  console.log(' - Shipping Error:', updatedOrder?.shippingError);

  if (updatedOrder?.awbNumber && !updatedOrder?.shippingError) {
    console.log('\n🎉 ALL REAL-TIME ITHINK LOGISTICS TESTS PASSED WITH LIVE AWB!');
  } else {
    console.error('\n⚠️ Test finished with status:', updatedOrder?.shippingStatus, 'Error:', updatedOrder?.shippingError);
  }
}

testFullFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
