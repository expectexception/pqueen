import { NextRequest, NextResponse } from 'next/server';
import { ShippingEngine } from '@/lib/shipping/engine';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let awb = id;
    let provider: any = 'ithink';

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: id },
          { orderNumber: id },
          { awbNumber: id }
        ]
      }
    });

    if (order) {
      awb = order.awbNumber || id;
    }

    const engine = ShippingEngine.getInstance();
    const trackingInfo = await engine.trackShipment(provider, awb);

    return NextResponse.json({ success: true, tracking: trackingInfo, order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
