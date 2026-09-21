import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const SETTINGS_FILE_PATH = path.join(process.cwd(), "data", "store-settings.json");
export const SETTINGS_DB_KEY = "store_settings";

export const defaultStoreSettings = {
  // Brand & Store Identity
  storeName: "PQN PARTY QUEEN",
  tagline: "Haute Couture & Luxury Indian Fashion",
  supportEmail: "thep4rtyqueen@gmail.com",
  conciergeWhatsApp: "+91 98765 43210",
  currency: "INR (₹)",
  storeAddress: "Z 147 A DBLOCK 2 FIR ARYA SAMAJ ROAD UTTAM NAGAR, New Delhi - 110059, India",
  announcementText: "✦ COMPLIMENTARY EXPRESS SHIPPING ACROSS INDIA • USE CODE PQN10 FOR 10% OFF ✦",

  // Maintenance Mode & Storefront Availability
  maintenanceMode: {
    enabled: false,
    title: "Atelier Private Preview & Scheduled Runway Upgrades",
    message: "Our digital atelier is currently undergoing curated runway updates. We are preparing our newest collections and will reopen shortly.",
    estimatedReopenTime: "Today at 6:00 PM IST",
    allowAdminBypass: true,
    emergencyWhatsApp: "+91 98765 43210",
  },

  // Tax & Legal Compliance
  gstin: "07AAACP9876Q1Z2",
  panNumber: "AAACP9876Q",
  defaultGSTRate: 12,

  // Invoice & Authorized Owner Signature
  invoiceOwnerSignatureUrl: null,
  invoiceSignatoryName: "Karan Oberoi",
  invoiceSignatoryTitle: "Authorized Signatory",
  invoiceCompanyName: "PQN PARTY QUEEN",

  // Marketing & Meta Tracking
  metaPixelId: "128492019482019",
  metaPixelEnabled: true,

  // Social Media & Community Channels
  socialLinks: {
    instagram: { enabled: true, url: "https://instagram.com/pqnpartyqueen", handle: "@pqnpartyqueen" },
    facebook: { enabled: true, url: "https://facebook.com/pqnpartyqueen", handle: "PQN Party Queen" },
    whatsapp: { enabled: true, url: "https://wa.me/919876543210", handle: "+91 98765 43210" },
    pinterest: { enabled: true, url: "https://pinterest.com/pqnpartyqueen", handle: "pqnpartyqueen" },
    youtube: { enabled: false, url: "https://youtube.com/@pqnpartyqueen", handle: "@pqnpartyqueen" },
    twitter: { enabled: false, url: "https://x.com/pqnpartyqueen", handle: "@pqnpartyqueen" },
  },

  // Vouchers
  activeVoucherCode: "PQN10",
  voucherDiscountPercent: 10,

  // Shipping & Logistics
  freeShippingMinimum: 0,
  defaultDeliveryPartner: "Shiprocket Smart Courier",
  deliveryPartners: [
    { name: "Shiprocket Smart Courier", enabled: true, trackingUrlPrefix: "https://shiprocket.co/tracking/" },
    { name: "Delhivery Air Express", enabled: true, trackingUrlPrefix: "https://www.delhivery.com/track/package/" },
    { name: "Blue Dart Express", enabled: true, trackingUrlPrefix: "https://www.bluedart.com/tracking?awb=" },
    { name: "DTDC Prime Gold", enabled: false, trackingUrlPrefix: "https://www.dtdc.in/tracking/" },
  ],
  shippingZones: [
    { name: "All India Standard (Complimentary)", rate: 0, estimatedDays: "3-5 business days", enabled: true },
    { name: "Metro Express Priority (Same/Next Day)", rate: 299, estimatedDays: "24-48 hours", enabled: true },
    { name: "International Global Luxury Courier (DHL/FedEx)", rate: 2499, estimatedDays: "5-7 business days", enabled: true },
  ],

  // Automated Multi-Carrier Shipping Engine Settings
  shippingEngineSettings: {
    selectionMode: "cheapest",
    primaryProvider: "shiprocket",
    fallbackToStandardIfUnavailable: true,
    complimentaryFreeShippingThreshold: 0,
    standardShippingFee: 0,
    codAdditionalFee: 0,
    defaultPackage: { weightKg: 0.8, lengthCm: 30, widthCm: 25, heightCm: 8 },
    pickupLocation: {
      name: "PQN Primary Warehouse",
      companyName: "PQN Party Queen Luxury Pret",
      addressLine1: "Z 147 A DBLOCK 2 FIR ARYA SAMAJ ROAD UTTAM NAGAR",
      addressLine2: "Near Arya Samaj Mandir",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110059",
      country: "India",
      phone: "+91 9999999999",
      email: "thep4rtyqueen@gmail.com",
    },
    providers: {},
  },

  // Payment Gateways
  paymentGateways: {
    razorpay: { enabled: true, mode: "live", keyId: "rzp_live_Tb79L3WjS62yNA", keySecret: "Nfx5qbTVBbvb7LFEy9h2MfgK" },
    cod: { enabled: true, maxCodAmount: 50000, codFee: 0 },
    upi: { enabled: true, vpaAddress: "thep4rtyqueen@icici" },
  },

  // Staff & Role Permissions
  staffMembers: [
    { id: "staff-1", name: "Karan Oberoi (Super Admin)", email: "P4RTYqueen@gmail.com", role: "SUPER_ADMIN", active: true, createdAt: "2026-01-01" },
  ],
};

function readLocalFile(): any {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[StoreSettings] Local file read error:", err);
  }
  return null;
}

function writeLocalFile(data: any) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[StoreSettings] Local file write error:", err);
  }
}

export async function getStoreSettings(): Promise<any> {
  try {
    const dbRecord = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_DB_KEY },
    });
    if (dbRecord && dbRecord.value && typeof dbRecord.value === "object") {
      const merged = { ...defaultStoreSettings, ...(dbRecord.value as Record<string, any>) };
      writeLocalFile(merged);
      return merged;
    }
  } catch (dbErr) {
    console.warn("[StoreSettings] Database query warning (falling back to disk):", dbErr);
  }

  const localData = readLocalFile();
  if (localData) {
    const merged = { ...defaultStoreSettings, ...localData };
    try {
      await prisma.systemSetting.upsert({
        where: { key: SETTINGS_DB_KEY },
        create: { key: SETTINGS_DB_KEY, value: merged },
        update: { value: merged },
      });
    } catch {}
    return merged;
  }

  return defaultStoreSettings;
}

export function getStoreSettingsSync(): any {
  const localData = readLocalFile();
  if (localData) {
    return { ...defaultStoreSettings, ...localData };
  }
  return defaultStoreSettings;
}

export async function updateStoreSettings(incoming: Record<string, any>): Promise<any> {
  const current = await getStoreSettings();
  const merged = {
    ...current,
    ...incoming,
    maintenanceMode: { ...(current.maintenanceMode || defaultStoreSettings.maintenanceMode), ...(incoming.maintenanceMode || {}) },
    socialLinks: { ...(current.socialLinks || defaultStoreSettings.socialLinks), ...(incoming.socialLinks || {}) },
    shippingEngineSettings: {
      ...(current.shippingEngineSettings || defaultStoreSettings.shippingEngineSettings),
      ...(incoming.shippingEngineSettings || {}),
      defaultPackage: { ...(current.shippingEngineSettings?.defaultPackage || defaultStoreSettings.shippingEngineSettings.defaultPackage), ...(incoming.shippingEngineSettings?.defaultPackage || {}) },
      pickupLocation: { ...(current.shippingEngineSettings?.pickupLocation || defaultStoreSettings.shippingEngineSettings.pickupLocation), ...(incoming.shippingEngineSettings?.pickupLocation || {}) },
      providers: { ...(current.shippingEngineSettings?.providers || {}), ...(incoming.shippingEngineSettings?.providers || {}) },
    },
    paymentGateways: {
      ...(current.paymentGateways || defaultStoreSettings.paymentGateways),
      ...(incoming.paymentGateways || {}),
      razorpay: {
        ...(current.paymentGateways?.razorpay || defaultStoreSettings.paymentGateways.razorpay),
        ...(incoming.paymentGateways?.razorpay || {}),
        keySecret:
          incoming.paymentGateways?.razorpay?.keySecret &&
          incoming.paymentGateways.razorpay.keySecret.trim() !== "" &&
          !incoming.paymentGateways.razorpay.keySecret.includes("••••")
            ? incoming.paymentGateways.razorpay.keySecret.trim()
            : current.paymentGateways?.razorpay?.keySecret || defaultStoreSettings.paymentGateways.razorpay.keySecret,
      },
    },
  };

  try {
    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_DB_KEY },
      create: { key: SETTINGS_DB_KEY, value: merged },
      update: { value: merged },
    });
  } catch (dbErr) {
    console.error("[StoreSettings] Database write error:", dbErr);
  }

  writeLocalFile(merged);
  return merged;
}
