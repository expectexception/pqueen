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

export class ShiprocketAdapter extends BaseShippingAdapter {
  private baseUrl = 'https://apiv2.shiprocket.in/v1/external';

  public get providerId(): ShippingProviderId {
    return 'shiprocket';
  }

  public get providerName(): string {
    return 'Shiprocket';
  }

  private async getAuthToken(): Promise<string> {
    const creds = this.config.credentials;
    if (creds.authToken && creds.tokenExpiry && Date.now() < creds.tokenExpiry) {
      return creds.authToken;
    }

    const email = creds.email || process.env.SHIPROCKET_EMAIL;
    const password = creds.password || process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error('Shiprocket email and password credentials are not configured');
    }

    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`Shiprocket auth failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error('Shiprocket authentication returned no token');
    }

    // Cache token
    creds.authToken = data.token;
    creds.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // 9 days validity
    return data.token;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${this.baseUrl}/account/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return {
        success: true,
        message: `Connected successfully to Shiprocket (${data.first_name || 'Verified Merchant'})`,
        details: { company: data.company_name, email: data.email }
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to authenticate with Shiprocket'
      };
    }
  }

  public async getRates(req: ServiceabilityCheckRequest): Promise<ShippingRateQuote[]> {
    try {
      const token = await this.getAuthToken();
      const params = new URLSearchParams({
        pickup_postcode: req.pickupPincode,
        delivery_postcode: req.deliveryPincode,
        weight: req.weightKg.toString(),
        cod: req.isCod ? '1' : '0'
      });
      if (req.orderValue) params.append('declared_value', req.orderValue.toString());

      const res = await fetch(`${this.baseUrl}/courier/serviceability?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return [];
      const data = await res.json();
      if (!data.data || !data.data.available_courier_companies) return [];

      return data.data.available_courier_companies.map((c: any) => ({
        providerId: this.providerId,
        providerName: this.providerName,
        courierId: String(c.courier_company_id),
        courierName: c.courier_name,
        serviceType: c.air_max_weight ? 'air' : 'surface',
        rate: Number(c.rate || 0),
        codCharge: Number(c.cod_charges || 0),
        totalCharge: Number(c.rate || 0) + (req.isCod ? Number(c.cod_charges || 0) : 0),
        estimatedDeliveryDays: Number(c.estimated_delivery_days || 4),
        estimatedDeliveryDate: c.etd,
        isServiceable: true,
        isCodAvailable: Boolean(c.cod === 1),
        rating: Number(c.rating || 4.2),
        minWeightKg: Number(c.min_weight || 0.5)
      }));
    } catch (err) {
      console.error('Shiprocket getRates error:', err);
      return [];
    }
  }

  public async createShipment(payload: CreateShipmentPayload): Promise<ShipmentResult> {
    const token = await this.getAuthToken();

    const orderData = {
      order_id: payload.orderNumber || payload.orderId,
      order_date: payload.orderDate ? payload.orderDate.split('T')[0] : new Date().toISOString().split('T')[0],
      pickup_location: payload.pickup.name || this.config.credentials.pickupLocationName || 'Primary Warehouse',
      billing_customer_name: payload.customer.name.split(' ')[0] || 'Customer',
      billing_last_name: payload.customer.name.split(' ').slice(1).join(' ') || '',
      billing_address: payload.customer.addressLine1,
      billing_address_2: payload.customer.addressLine2 || '',
      billing_city: payload.customer.city,
      billing_pincode: payload.customer.pincode,
      billing_state: payload.customer.state,
      billing_country: payload.customer.country || 'India',
      billing_email: payload.customer.email,
      billing_phone: payload.customer.phone,
      shipping_is_billing: true,
      order_items: payload.items.map(item => ({
        name: item.name,
        sku: item.sku || 'SKU-ITEM',
        units: item.quantity,
        selling_price: item.unitPrice,
        discount: 0,
        tax: item.taxRatePercent || 0,
        hsn: item.hsnCode || 6204
      })),
      payment_method: payload.isCod ? 'COD' : 'Prepaid',
      sub_total: payload.invoiceValue,
      length: payload.package.lengthCm,
      breadth: payload.package.widthCm,
      height: payload.package.heightCm,
      weight: payload.package.weightKg
    };

    const res = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`Shiprocket create order failed: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    const shipmentId = String(data.shipment_id || data.order_id);

    // If courierId was provided, generate AWB
    let awbNumber = data.awb_code || '';
    let courierName = payload.courierName || 'Shiprocket Courier';
    if (!awbNumber && payload.courierId) {
      const awbRes = await fetch(`${this.baseUrl}/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shipment_id: shipmentId,
          courier_id: payload.courierId
        })
      });
      if (awbRes.ok) {
        const awbData = await awbRes.json();
        awbNumber = awbData.response?.data?.awb_code || '';
        courierName = awbData.response?.data?.courier_name || courierName;
      }
    }

    return {
      success: true,
      providerId: this.providerId,
      providerName: this.providerName,
      shipmentId,
      orderId: payload.orderId,
      awbNumber,
      courierName,
      courierId: payload.courierId,
      labelUrl: data.label_url,
      rawResponse: data
    };
  }

  public async getLabel(shipmentId: string, awbNumber?: string): Promise<{ labelUrl?: string; pdfBase64?: string }> {
    const token = await this.getAuthToken();
    const res = await fetch(`${this.baseUrl}/courier/generate/label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ shipment_id: [shipmentId] })
    });
    if (!res.ok) throw new Error('Failed to generate label from Shiprocket');
    const data = await res.json();
    return { labelUrl: data.label_url || data.response?.label_url };
  }

  public async schedulePickup(req: PickupScheduleRequest): Promise<PickupScheduleResult> {
    const token = await this.getAuthToken();
    const res = await fetch(`${this.baseUrl}/courier/generate/pickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ shipment_id: [req.shipmentId] })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return { success: false, error: err.message || 'Pickup scheduling failed' };
    }
    const data = await res.json();
    return {
      success: true,
      pickupTokenNumber: data.response?.pickup_token_number || String(data.pickup_id || ''),
      pickupScheduledDate: req.pickupDate,
      message: 'Pickup scheduled with Shiprocket courier'
    };
  }

  public async trackShipment(awbNumber: string, shipmentId?: string): Promise<TrackingDetails> {
    const token = await this.getAuthToken();
    const res = await fetch(`${this.baseUrl}/courier/track/awb/${awbNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Tracking request failed with status ${res.status}`);
    const data = await res.json();
    const trackingData = data.tracking_data || {};
    const trackObj = trackingData.shipment_track_activities || [];

    const events = Array.isArray(trackObj)
      ? trackObj.map((act: any) => ({
          timestamp: act.date || new Date().toISOString(),
          status: act['sr-status-label'] || act.activity || 'IN_TRANSIT',
          activity: act.activity || act['sr-status-label'] || '',
          location: act.location || ''
        }))
      : [];

    let currentStatus: TrackingDetails['currentStatus'] = 'IN_TRANSIT';
    const statusStr = String(trackingData.shipment_status || '').toUpperCase();
    if (statusStr.includes('DELIVERED')) currentStatus = 'DELIVERED';
    else if (statusStr.includes('OUT FOR DELIVERY')) currentStatus = 'OUT_FOR_DELIVERY';
    else if (statusStr.includes('PICKED UP')) currentStatus = 'PICKED_UP';
    else if (statusStr.includes('RTO')) currentStatus = 'RTO';
    else if (statusStr.includes('CANCEL')) currentStatus = 'CANCELLED';

    return {
      providerId: this.providerId,
      awbNumber,
      courierName: trackingData.courier_name || 'Shiprocket Express',
      currentStatus,
      statusText: trackingData.shipment_status || 'In Transit',
      origin: trackingData.origin || 'Surat / Mumbai',
      destination: trackingData.destination || 'Customer Address',
      expectedDelivery: trackingData.edd,
      events,
      rawResponse: data
    };
  }

  public async cancelShipment(awbNumber: string, shipmentId?: string): Promise<{ success: boolean; message: string }> {
    const token = await this.getAuthToken();
    const res = await fetch(`${this.baseUrl}/orders/cancel/shipment/awbs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ awbs: [awbNumber] })
    });
    if (!res.ok) throw new Error('Failed to cancel shipment on Shiprocket');
    const data = await res.json();
    return { success: true, message: data.message || 'Shipment cancelled' };
  }
}
