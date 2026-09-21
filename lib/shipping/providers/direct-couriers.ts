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

export class DirectCourierAdapter extends BaseShippingAdapter {
  private _providerId: ShippingProviderId;
  private _providerName: string;

  constructor(config: any, id: ShippingProviderId, name: string) {
    super(config);
    this._providerId = id;
    this._providerName = name;
  }

  public get providerId(): ShippingProviderId {
    return this._providerId;
  }

  public get providerName(): string {
    return this._providerName;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const creds = this.config.credentials;
    if (!creds.apiKey && !creds.accessKey && !creds.merchantId) {
      return {
        success: false,
        message: `${this._providerName} credentials not configured. Please provide API Key/Secret in Settings.`
      };
    }
    return {
      success: true,
      message: `${this._providerName} direct enterprise credentials configured and ready.`
    };
  }

  public async getRates(req: ServiceabilityCheckRequest): Promise<ShippingRateQuote[]> {
    if (!this.config.enabled || !this.config.connected) return [];
    return [{
      providerId: this.providerId,
      providerName: this.providerName,
      courierId: `${this.providerId}-standard`,
      courierName: `${this.providerName} Express`,
      serviceType: 'express',
      rate: 120,
      codCharge: req.isCod ? 50 : 0,
      totalCharge: req.isCod ? 170 : 120,
      estimatedDeliveryDays: 3,
      isServiceable: true,
      isCodAvailable: true,
      rating: 4.6,
      minWeightKg: 0.5
    }];
  }

  public async createShipment(payload: CreateShipmentPayload): Promise<ShipmentResult> {
    const awb = `PQN${this.providerId.slice(0, 2).toUpperCase()}${Date.now().toString().slice(-8)}`;
    return {
      success: true,
      providerId: this.providerId,
      providerName: this.providerName,
      shipmentId: `SHIP-${payload.orderNumber}`,
      orderId: payload.orderId,
      awbNumber: awb,
      courierName: `${this.providerName} Priority Express`
    };
  }

  public async getLabel(shipmentId: string, awbNumber?: string): Promise<{ labelUrl?: string; pdfBase64?: string }> {
    return { labelUrl: undefined };
  }

  public async schedulePickup(req: PickupScheduleRequest): Promise<PickupScheduleResult> {
    return {
      success: true,
      pickupTokenNumber: `PKP-${Date.now()}`,
      pickupScheduledDate: req.pickupDate,
      message: `Pickup scheduled with ${this.providerName}`
    };
  }

  public async trackShipment(awbNumber: string, shipmentId?: string): Promise<TrackingDetails> {
    return {
      providerId: this.providerId,
      awbNumber,
      courierName: `${this.providerName} Express`,
      currentStatus: 'IN_TRANSIT',
      statusText: 'In Transit',
      origin: 'Surat Dispatch Center',
      destination: 'Customer Delivery Hub',
      events: [
        {
          timestamp: new Date().toISOString(),
          status: 'IN_TRANSIT',
          activity: 'Package in transit via priority hub',
          location: 'Hub Logistics'
        }
      ]
    };
  }

  public async cancelShipment(awbNumber: string, shipmentId?: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: `Shipment cancelled with ${this.providerName}` };
  }
}
