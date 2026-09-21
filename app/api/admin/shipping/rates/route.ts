import { NextRequest, NextResponse } from 'next/server';
import { ShippingEngine } from '@/lib/shipping/engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const engine = ShippingEngine.getInstance();
    const quotesResult = await engine.getQuotes(body);
    return NextResponse.json({ success: true, ...quotesResult });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
