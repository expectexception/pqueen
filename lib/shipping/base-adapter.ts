import {
  ShippingProviderId,
  ShippingProviderConfig,
  ServiceabilityCheckRequest,
  ShippingRateQuote,
  CreateShipmentPayload,
  ShipmentResult,
  TrackingDetails,
  PickupScheduleRequest,
  PickupScheduleResult
} from './types';

export abstract class BaseShippingAdapter {
  protected config: ShippingProviderConfig;

  constructor(config: ShippingProviderConfig) {
    this.config = config;
  }

  public abstract get providerId(): ShippingProviderId;
  public abstract get providerName(): string;

  /**
   * Test live API connection using provider credentials.
   * Returns true if authenticated successfully, throws Error or returns false otherwise.
   */
  public abstract testConnection(): Promise<{ success: boolean; message: string; details?: any }>;

  /**
   * Check serviceability & get live rates for pickup and delivery pin codes.
   */
  public abstract getRates(req: ServiceabilityCheckRequest): Promise<ShippingRateQuote[]>;

  /**
   * Create shipment / generate AWB with the provider.
   */
  public abstract createShipment(payload: CreateShipmentPayload): Promise<ShipmentResult>;

  /**
   * Fetch shipping label (PDF url or base64 stream).
   */
  public abstract getLabel(shipmentId: string, awbNumber?: string): Promise<{ labelUrl?: string; pdfBase64?: string }>;

  /**
   * Schedule pickup with carrier.
   */
  public abstract schedulePickup(req: PickupScheduleRequest): Promise<PickupScheduleResult>;

  /**
   * Track shipment milestone events by AWB.
   */
  public abstract trackShipment(awbNumber: string, shipmentId?: string): Promise<TrackingDetails>;

  /**
   * Cancel shipment / manifest.
   */
  public abstract cancelShipment(awbNumber: string, shipmentId?: string): Promise<{ success: boolean; message: string }>;
}
