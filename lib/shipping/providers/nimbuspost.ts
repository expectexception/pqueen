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

export class NimbusPostAdapter extends BaseShippingAdapter {
  private baseUrl = 'https://api.nimbuspost.com/v1';

  public get providerId(): ShippingProviderId {
    return 'nimbuspost';
  }

  public get providerName(): string {
    return 'NimbusPost';
  }

  private getApiKey(): string {
    const key = this.config.credentials.apiKey || process.env.NIMBUSPOST_API_KEY;
    if (!key) throw new Error('NimbusPost API Key is not configured');
    return key;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/users/profile`, {
        headers: { 'api-key': apiKey }
      });
      if (!res.ok) throw new Error(`NimbusPost API returned ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (!data.status) throw new Error(data.message || 'Authentication failed');
      return {
        success: true,
        message: `Connected successfully to NimbusPost (${data.data?.name || 'Verified'})`,
        details: data.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to authenticate with NimbusPost' };
    }
  }

  public async getRates(req: ServiceabilityCheckRequest): Promise<ShippingRateQuote[]> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/courier/serviceability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          origin: req.pickupPincode,
          destination: req.deliveryPincode,
          weight: req.weightKg * 1000, // grams
          payment_type: req.isCod ? 'cod' : 'prepaid',
          order_amount: req.orderValue || 1000
        })
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.status || !Array.isArray(data.data)) return [];

      return data.data.map((c: any) => ({
        providerId: this.providerId,
        providerName: this.providerName,
        courierId: String(c.courier_id || c.id),
        courierName: c.courier_name || c.name,
        serviceType: 'surface',
        rate: Number(c.freight_charge || c.total_charge || 0),
        codCharge: Number(c.cod_charges || 0),
        totalCharge: Number(c.total_charge || c.freight_charge || 0),
        estimatedDeliveryDays: Number(c.estimated_delivery_days || 4),
        estimatedDeliveryDate: c.expected_delivery_date,
        isServiceable: true,
        isCodAvailable: Boolean(c.is_cod_available ?? true),
        rating: 4.3,
        minWeightKg: 0.5
      }));
    } catch (err) {
      console.error('NimbusPost getRates error:', err);
      return [];
    }
  }

  public async createShipment(payload: CreateShipmentPayload): Promise<ShipmentResult> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        order_number: payload.orderNumber,
        shipping_charges: 0,
        discount: 0,
        cod_charges: 0,
        payment_type: payload.isCod ? 'cod' : 'prepaid',
        order_amount: payload.invoiceValue,
        package_weight: payload.package.weightKg * 1000,
        package_length: payload.package.lengthCm,
        package_breadth: payload.package.widthCm,
        package_height: payload.package.heightCm,
        consignee: {
          name: payload.customer.name,
          address: payload.customer.addressLine1,
          address_2: payload.customer.addressLine2 || '',
          city: payload.customer.city,
          state: payload.customer.state,
          pincode: payload.customer.pincode,
          phone: payload.customer.phone
        },
        pickup: {
          warehouse_name: payload.pickup.name || 'Primary'
        },
        order_items: payload.items.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.unitPrice,
          sku: item.sku || 'ITEM'
        })),
        courier_id: payload.courierId
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`NimbusPost create shipment failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      success: true,
      providerId: this.providerId,
      providerName: this.providerName,
      shipmentId: String(data.data?.shipment_id || data.data?.order_id || ''),
      orderId: payload.orderId,
      awbNumber: data.data?.awb_number || '',
      courierName: data.data?.courier_name || payload.courierName || 'NimbusPost Partner',
      labelUrl: data.data?.label_url,
      rawResponse: data
    };
  }

  public async getLabel(shipmentId: string, awbNumber?: string): Promise<{ labelUrl?: string; pdfBase64?: string }> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/shipments/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({ awb: awbNumber || shipmentId })
    });
    if (!res.ok) throw new Error('Failed to get NimbusPost label');
    const data = await res.json();
    return { labelUrl: data.data?.label_url || data.data?.url };
  }

  public async schedulePickup(req: PickupScheduleRequest): Promise<PickupScheduleResult> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/shipments/pickup-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        awb: [req.awbNumber],
        pickup_date: req.pickupDate
      })
    });
    if (!res.ok) return { success: false, error: 'NimbusPost pickup schedule failed' };
    const data = await res.json();
    return {
      success: true,
      pickupTokenNumber: data.data?.token || req.awbNumber,
      message: 'Pickup request created with NimbusPost'
    };
  }

  public async trackShipment(awbNumber: string, shipmentId?: string): Promise<TrackingDetails> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/shipments/track/${awbNumber}`, {
      headers: { 'api-key': apiKey }
    });
    if (!res.ok) throw new Error('NimbusPost tracking failed');
    const data = await res.json();
    const track = data.data || {};
    const events = (track.history || []).map((h: any) => ({
      timestamp: h.event_time || h.date || new Date().toISOString(),
      status: h.status || 'IN_TRANSIT',
      activity: h.activity || h.location || '',
      location: h.location || ''
    }));

    let currentStatus: TrackingDetails['currentStatus'] = 'IN_TRANSIT';
    const st = String(track.current_status || '').toUpperCase();
    if (st.includes('DELIVER')) currentStatus = 'DELIVERED';
    else if (st.includes('OUT')) currentStatus = 'OUT_FOR_DELIVERY';
    else if (st.includes('PICK')) currentStatus = 'PICKED_UP';

    return {
      providerId: this.providerId,
      awbNumber,
      courierName: track.courier_name || 'NimbusPost Express',
      currentStatus,
      statusText: track.current_status || 'In Transit',
      origin: track.origin || 'Surat',
      destination: track.destination || 'Customer Address',
      expectedDelivery: track.edd,
      events,
      rawResponse: data
    };
  }

  public async cancelShipment(awbNumber: string, shipmentId?: string): Promise<{ success: boolean; message: string }> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${this.baseUrl}/shipments/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({ awb: awbNumber })
    });
    if (!res.ok) throw new Error('NimbusPost cancel failed');
    const data = await res.json();
    return { success: true, message: data.message || 'Cancelled' };
  }
}
