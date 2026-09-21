/**
 * PQN PARTY QUEEN - Central Application Configuration & Feature Flags
 * Controls AI engines, storefront capabilities, concierge integrations, and business settings.
 */

export const appConfig = {
  // Brand & Localization
  brand: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "PQN PARTY QUEEN",
    tagline: "Haute Couture & Luxury Indian Fashion",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹",
    currencyCode: process.env.NEXT_PUBLIC_CURRENCY_CODE || "INR",
    freeShippingMin: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_MIN || 15000),
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "concierge@pqnpartyqueen.com",
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_CONCIERGE_NUMBER || "+919876543210",
  },

  // AI & Gemini Engine Features
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "",
    enableVirtualTryOn: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_AI_TRYON, true),
    enableAiFilters: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_AI_FILTERS, true),
    enableStylingAdvisor: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_AI_STYLING_ADVISOR, true),
    providerPriority: process.env.AI_PROVIDER_PRIORITY || "gemini,meta,fashn,simulation",
  },

  // Storefront & Atelier Features
  features: {
    enableRunwayVideos: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_RUNWAY_VIDEOS, true),
    enableReviews: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_REVIEWS, true),
    enableInquiries: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_INQUIRIES, true),
    enableTickets: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_TICKETS, true),
    enableCoupons: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_COUPONS, true),
    enableWishlist: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_WISHLIST, true),
    enableAnnouncementBar: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANNOUNCEMENT_BAR, true),
    enableWhatsappConcierge: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_CONCIERGE, true),
  },
};

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === "") return defaultValue;
  const lower = String(value).trim().toLowerCase();
  return lower === "true" || lower === "1" || lower === "yes" || lower === "on";
}

export type AppConfig = typeof appConfig;
