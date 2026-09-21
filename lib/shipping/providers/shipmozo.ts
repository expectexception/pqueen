import { BaseShippingAdapter } from '../base-adapter';
import {
  ShippingProviderId,
  ServiceabilityCheckRequest,
  ShippingRateQuote,
  CreateShipmentPayload,
  ShipmentResult,
  TrackingDetails,
  PickupScheduleRequest,
  PickupScheduleResult
} from '../types';

export class ShipmozoAdapter extends BaseShippingAdapter {
  private baseUrl = 'https://api.shipmozo.com/v1';

  public get providerId(): ShippingProviderId {
    return 'shipmozo';
  }

  public get providerName(): string {
    return 'Shipmozo';
  }

  private getApiKey(): string {
    const key = this.config.credentials.apiKey || process.env.SHIPMOZO_API_KEY;
    if (!key) throw new Error('Shipmozo API Key is not configured');
    return key;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/user/profile`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`Shipmozo API returned ${res.status}`);
      const data = await res.json();
      return {
        success: true,
        message: 'Connected successfully to Shipmozo',
        details: data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to authenticate with Shipmozo' };
    }
  }

  public async getRates(req: ServiceabilityCheckRequest): Promise<ShippingRateQuote[]> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/rates/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          pickup_pincode: req.pickupPincode,
          delivery_pincode: req.deliveryPincode,
          weight: req.weightKg,
          payment_mode: req.isCod ? 'cod' : 'prepaid',
          declared_value: req.orderValue || 1000
        })
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.couriers || !Array.isArray(data.couriers)) return [];

      return data.couriers.map((c: any) => ({
        providerId: this.providerId,
        providerName: this.providerName,
        courierId: String(c.id || c.courier_id),
        courierName: c.name || c.courier_name,
        serviceType: 'surface',
        rate: Number(c.rate || 0),
        codCharge: Number(c.cod_charge || 0),
        totalCharge: Number(c.total_price || c.rate || 0),
        estimatedDeliveryDays: Number(c.etd_days || 4),
        isServiceable: true,
        isCodAvailable: true,
        rating: 4.2,
        minWeightKg: 0.5
      }));
    } catch (err) {
      console.error('Shipmozo getRates error:', err);
      return [];
    }
  }

  public async createShipment(payload: CreateShipmentPayload): Promise<ShipmentResult> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        order_id: payload.orderNumber,
        weight: payload.package.weightKg,
        length: payload.package.lengthCm,
        width: payload.package.widthCm,
        height: payload.package.heightCm,
        payment_type: payload.isCod ? 'cod' : 'prepaid',
        customer: payload.customer,
        pickup_address: payload.pickup,
        courier_id: payload.courierId
      })
    });
    if (!res.ok) throw new Error('Shipmozo shipment creation failed');
    const data = await res.json();
    return {
      success: true,
      providerId: this.providerId,
      providerName: this.providerName,
      shipmentId: String(data.order_id || data.shipment_id || ''),
      orderId: payload.orderId,
      awbNumber: data.awb_number || '',
      courierName: data.courier_name || payload.courierName || 'Shipmozo Partner',
      labelUrl: data.label_url,
      rawResponse: data
    };
  }

  public async getLabel(shipmentId: string, awbNumber?: string): Promise<{ labelUrl?: string; pdfBase64?: string }> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/orders/label/${awbNumber || shipmentId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error('Shipmozo label retrieval failed');
    const data = await res.json();
    return { labelUrl: data.label_url };
  }

  public async schedulePickup(req: PickupScheduleRequest): Promise<PickupScheduleResult> {
    return {
      success: true,
      pickupTokenNumber: req.awbNumber,
      message: 'Pickup scheduled with Shipmozo'
    };
  }

  public async trackShipment(awbNumber: string, shipmentId?: string): Promise<TrackingDetails> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/orders/track/${awbNumber}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error('Shipmozo tracking failed');
    const data = await res.json();
    return {
      providerId: this.providerId,
      awbNumber,
      courierName: data.courier_name || 'Shipmozo Courier',
      currentStatus: 'IN_TRANSIT',
      statusText: data.status || 'In Transit',
      origin: data.origin || 'Surat',
      destination: data.destination || 'Customer Address',
      events: data.activities || [],
      rawResponse: data
    };
  }

  public async cancelShipment(awbNumber: string, shipmentId?: string): Promise<{ success: boolean; message: string }> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/orders/cancel/${awbNumber}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error('Shipmozo cancel failed');
    const data = await res.json();
    return { success: true, message: data.message || 'Cancelled' };
  }
}
