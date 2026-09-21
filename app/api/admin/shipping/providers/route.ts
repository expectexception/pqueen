import { NextRequest, NextResponse } from 'next/server';
import { ShippingEngine } from '@/lib/shipping/engine';
import { ShippingProviderId } from '@/lib/shipping/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const engine = ShippingEngine.getInstance();
    engine.reload();
    const settings = engine.getSettings();

    return NextResponse.json({
      success: true,
      selectionMode: settings.selectionMode,
      primaryProvider: settings.primaryProvider,
      fallbackToStandardIfUnavailable: settings.fallbackToStandardIfUnavailable,
      complimentaryFreeShippingThreshold: settings.complimentaryFreeShippingThreshold,
      standardShippingFee: settings.standardShippingFee,
      codAdditionalFee: settings.codAdditionalFee,
      defaultPackage: settings.defaultPackage,
      pickupLocation: settings.pickupLocation,
      providers: settings.providers || {}
    });
  } catch (err: any) {
    console.error('Error fetching shipping providers:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const engine = ShippingEngine.getInstance();
    const currentSettings = engine.getSettings();

    const updatedProviders = { ...(currentSettings.providers || {}) } as Record<string, any>;

    // Handle single provider update (from Modal)
    if (body.providerId && body.providerConfig) {
      const existing = updatedProviders[body.providerId] || {};
      const newCreds = {
        ...(existing.credentials || {}),
        ...(body.providerConfig.credentials || {})
      };

      updatedProviders[body.providerId] = {
        ...existing,
        ...body.providerConfig,
        credentials: newCreds
      };
    }

    // Handle bulk providers update (from global settings save)
    if (body.providers && typeof body.providers === 'object') {
      for (const [pId, pConf] of Object.entries(body.providers as Record<string, any>)) {
        const existing = updatedProviders[pId] || {};
        const newCreds = {
          ...(existing.credentials || {}),
          ...((pConf as any).credentials || {})
        };
        updatedProviders[pId] = {
          ...existing,
          ...pConf,
          credentials: newCreds
        };
      }
    }

    await engine.saveSettings({
      selectionMode: body.selectionMode || currentSettings.selectionMode,
      primaryProvider: body.primaryProvider || currentSettings.primaryProvider,
      fallbackToStandardIfUnavailable: body.fallbackToStandardIfUnavailable ?? currentSettings.fallbackToStandardIfUnavailable,
      complimentaryFreeShippingThreshold: body.complimentaryFreeShippingThreshold !== undefined 
        ? Number(body.complimentaryFreeShippingThreshold) 
        : currentSettings.complimentaryFreeShippingThreshold,
      standardShippingFee: body.standardShippingFee !== undefined 
        ? Number(body.standardShippingFee) 
        : currentSettings.standardShippingFee,
      codAdditionalFee: body.codAdditionalFee !== undefined 
        ? Number(body.codAdditionalFee) 
        : currentSettings.codAdditionalFee,
      defaultPackage: body.defaultPackage || currentSettings.defaultPackage,
      pickupLocation: body.pickupLocation || currentSettings.pickupLocation,
      providers: updatedProviders as any
    });

    return NextResponse.json({
      success: true,
      message: 'Shipping provider configuration saved permanently.',
      providers: updatedProviders
    });
  } catch (err: any) {
    console.error('Error saving shipping provider:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
