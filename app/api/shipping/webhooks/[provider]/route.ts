import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const payload = await req.json();

    console.log(`Received shipping webhook from ${provider}:`, JSON.stringify(payload).slice(0, 200));

    const orderNumber = payload.order_id || payload.orderNumber || payload.order_number;
    const status = (payload.current_status || payload.status || payload.shipment_status || '').toUpperCase();

    if (orderNumber && status) {
      let mappedStatus: 'DELIVERED' | 'SHIPPED' | 'CANCELLED' | undefined;
      if (status.includes('DELIVERED')) mappedStatus = 'DELIVERED';
      else if (status.includes('OUT FOR DELIVERY') || status.includes('IN TRANSIT')) mappedStatus = 'SHIPPED';
      else if (status.includes('CANCEL')) mappedStatus = 'CANCELLED';

      if (mappedStatus) {
        await prisma.order.updateMany({
          where: {
            OR: [
              { orderNumber: String(orderNumber) },
              { orderNumber: `PQN-${orderNumber}` }
            ]
          },
          data: { status: mappedStatus }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (err: any) {
    console.error('Shipping webhook error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
