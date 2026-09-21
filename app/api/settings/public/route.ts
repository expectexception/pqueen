import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getStoreSettings();

    return NextResponse.json({
      success: true,
      maintenanceMode: settings.maintenanceMode,
      socialLinks: settings.socialLinks,
      storeName: settings.storeName || "PQN PARTY QUEEN",
      supportEmail: settings.supportEmail || "thep4rtyqueen@gmail.com",
      conciergeWhatsApp: settings.conciergeWhatsApp || "+91 98765 43210",
      announcementText: settings.announcementText || "",
      invoiceOwnerSignatureUrl: settings.invoiceOwnerSignatureUrl || null,
      invoiceSignatoryName: settings.invoiceSignatoryName || "Karan Oberoi",
      invoiceSignatoryTitle: settings.invoiceSignatoryTitle || "Authorized Signatory",
      invoiceCompanyName: settings.invoiceCompanyName || "PQN PARTY QUEEN",
    });
  } catch (error) {
    console.error("Error fetching public store settings:", error);
    return NextResponse.json({
      success: true,
      storeName: "PQN PARTY QUEEN",
    });
  }
}
