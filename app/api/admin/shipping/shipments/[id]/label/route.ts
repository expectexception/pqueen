import { NextRequest, NextResponse } from 'next/server';
import { ShippingEngine } from '@/lib/shipping/engine';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params;
    const providerId = (req.nextUrl.searchParams.get('provider') || 'shiprocket') as any;
    const awb = req.nextUrl.searchParams.get('awb') || shipmentId;

    const engine = ShippingEngine.getInstance();
    const adapter = engine.getAdapter(providerId);

    if (!adapter) {
      return NextResponse.json({ success: false, error: 'Adapter not found' }, { status: 404 });
    }

    const labelResult = await adapter.getLabel(shipmentId, awb);
    return NextResponse.json({ success: true, ...labelResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
