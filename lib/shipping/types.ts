export type ShippingProviderId = 
  | 'shiprocket'
  | 'nimbuspost'
  | 'ithink'
  | 'shipmozo'
  | 'delhivery'
  | 'dtdc'
  | 'bluedart'
  | 'xpressbees'
  | 'manual';

export type CourierSelectionMode = 'cheapest' | 'fastest' | 'best_rated' | 'priority' | 'manual';

export interface ProviderCredentials {
  // Shiprocket
  email?: string;
  password?: string;
  authToken?: string;
  tokenExpiry?: number;
  
  // NimbusPost / iThink / Shipmozo / Delhivery / etc.
  apiKey?: string;
  apiSecret?: string;
  accessKey?: string;
  merchantId?: string;
  clientId?: string;
  clientSecret?: string;
  
  // General / Custom
  pickupLocationName?: string;
  pickupPincode?: string;
  sandboxMode?: boolean;
  [key: string]: any;
}

export interface ShippingProviderConfig {
  id: ShippingProviderId;
  name: string;
  description: string;
  website: string;
  logo?: string;
  enabled: boolean;
  connected: boolean;
  lastTestedAt?: string;
  lastError?: string;
  priority: number; // 1 = highest
  credentials: ProviderCredentials;
  supportedModes: ('surface' | 'air' | 'express' | 'cod')[];
}

export interface PackageDimensions {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface WarehouseLocation {
  name: string;
  companyName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
}

export interface ShippingEngineSettings {
  selectionMode: CourierSelectionMode;
  fallbackToStandardIfUnavailable: boolean;
  complimentaryFreeShippingThreshold: number;
  standardShippingFee: number;
  codAdditionalFee: number;
  defaultPackage: PackageDimensions;
  pickupLocation: WarehouseLocation;
  primaryProvider: ShippingProviderId;
  providers: Record<ShippingProviderId, ShippingProviderConfig>;
}

export interface ServiceabilityCheckRequest {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  isCod?: boolean;
  orderValue?: number;
}

export interface ShippingRateQuote {
  providerId: ShippingProviderId;
  providerName: string;
  courierId: string;
  courierName: string;
  serviceType: string; // 'surface' | 'air' | 'express'
  rate: number;
  codCharge: number;
  totalCharge: number;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
  isServiceable: boolean;
  isCodAvailable: boolean;
  rating?: number; // 1-5
  minWeightKg?: number;
}

export interface ShipmentItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  hsnCode?: string;
  taxRatePercent?: number;
}

export interface CreateShipmentPayload {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  pickup: WarehouseLocation;
  items: ShipmentItem[];
  package: PackageDimensions;
  isCod: boolean;
  codAmount?: number;
  invoiceValue: number;
  courierId?: string;
  courierName?: string;
  resellerName?: string;
}

export interface ShipmentResult {
  success: boolean;
  providerId: ShippingProviderId;
  providerName: string;
  shipmentId: string;
  orderId: string;
  awbNumber: string;
  courierName: string;
  courierId?: string;
  routingCode?: string;
  labelUrl?: string;
  trackingUrl?: string;
  manifestUrl?: string;
  invoiceUrl?: string;
  pickupScheduled?: boolean;
  pickupToken?: string;
  expectedDeliveryDate?: string;
  rawResponse?: any;
  error?: string;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  statusCode?: string;
  activity: string;
  location?: string;
  courierRemarks?: string;
}

export interface TrackingDetails {
  providerId: ShippingProviderId;
  awbNumber: string;
  courierName: string;
  currentStatus: 'ORDER_PLACED' | 'PICKUP_SCHEDULED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RTO' | 'CANCELLED' | 'UNDELIVERED';
  statusText: string;
  origin: string;
  destination: string;
  expectedDelivery?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  events: TrackingEvent[];
  rawResponse?: any;
}

export interface PickupScheduleRequest {
  shipmentId: string;
  awbNumber: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTimeSlot?: string;
  pickupLocationName: string;
  packageCount: number;
}

export interface PickupScheduleResult {
  success: boolean;
  pickupTokenNumber?: string;
  pickupScheduledDate?: string;
  message?: string;
  error?: string;
}

export interface AutoFulfillmentResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  stockVerified: boolean;
  stockWarnings?: string[];
  courierSelected?: {
    courierName: string;
    courierId: string;
    providerId: ShippingProviderId;
    rate: number;
    estimatedDeliveryDays: number;
  };
  shipment?: ShipmentResult;
  pickup?: PickupScheduleResult;
  error?: string;
}

