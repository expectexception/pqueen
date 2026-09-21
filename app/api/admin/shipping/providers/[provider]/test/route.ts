import { NextRequest, NextResponse } from 'next/server';
import { ShippingEngine } from '@/lib/shipping/engine';
import { ShippingProviderId } from '@/lib/shipping/types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const providerId = provider as ShippingProviderId;
    const body = await req.json().catch(() => ({}));
    const engine = ShippingEngine.getInstance();

    const result = await engine.testProviderConnection(providerId, body.credentials);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Connection test failed' }, { status: 500 });
  }
}
