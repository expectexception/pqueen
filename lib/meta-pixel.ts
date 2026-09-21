/**
 * Meta Pixel (Facebook & Instagram Ad & Reel Tracking) Helpers
 */

export const DEFAULT_PIXEL_ID = "128492019482019"; // Default or placeholder ID

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export type MetaPixelEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "Contact";

export function trackMetaEvent(
  event: MetaPixelEvent,
  params?: Record<string, any>
) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      if (params) {
        window.fbq("track", event, params);
      } else {
        window.fbq("track", event);
      }
      if (process.env.NODE_ENV === "development") {
        console.log(`[Meta Pixel] Event tracked: ${event}`, params);
      }
    } catch (err) {
      console.warn("[Meta Pixel] Event dispatch error:", err);
    }
  }
}

export function trackMetaCustomEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("trackCustom", eventName, params || {});
    } catch (err) {
      console.warn("[Meta Pixel] Custom event error:", err);
    }
  }
}
