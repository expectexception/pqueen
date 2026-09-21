import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

const TAX_FILE_PATH = path.join(process.cwd(), "data", "tax-settings.json");

type TaxHubData = {
  jurisdictionRules: Array<{
    stateOrCountry: string;
    taxType: "GST" | "VAT" | "SALES_TAX" | "ZERO_RATED";
    rate: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    notes: string;
  }>;
  categoryTaxRates: Array<{
    categoryId: string;
    categoryName: string;
    hsnCode: string;
    standardRate: number;
    luxuryThresholdRate?: number;
    luxuryThresholdAmount?: number;
  }>;
  exemptions: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    businessName: string;
    gstinOrTaxId: string;
    exemptionType: "B2B_WHOLESALE" | "SEZ_EXPORT" | "DIPLOMATIC";
    active: boolean;
    validUntil: string;
  }>;
  nexusThresholds: Array<{
    jurisdiction: string;
    statutoryLimit: number;
    currentVolume: number;
    ordersCount: number;
    status: "SAFE" | "APPROACHING" | "EXCEEDED";
  }>;
};

const defaultTaxHubData: TaxHubData = {
  jurisdictionRules: [
    { stateOrCountry: "Delhi (Intra-State Home)", taxType: "GST", rate: 12, cgstRate: 6, sgstRate: 6, igstRate: 0, notes: "CGST 6% + SGST 6% on domestic shipments within Delhi NCT" },
    { stateOrCountry: "Maharashtra (Inter-State)", taxType: "GST", rate: 12, cgstRate: 0, sgstRate: 0, igstRate: 12, notes: "Integrated IGST 12% on inter-state shipments" },
    { stateOrCountry: "Karnataka (Inter-State)", taxType: "GST", rate: 12, cgstRate: 0, sgstRate: 0, igstRate: 12, notes: "Integrated IGST 12% on inter-state shipments" },
    { stateOrCountry: "Gujarat (Inter-State)", taxType: "GST", rate: 12, cgstRate: 0, sgstRate: 0, igstRate: 12, notes: "Integrated IGST 12% on inter-state shipments" },
    { stateOrCountry: "United States (International)", taxType: "ZERO_RATED", rate: 0, igstRate: 0, notes: "Zero-rated export of couture goods under Letter of Undertaking (LUT)" },
    { stateOrCountry: "United Kingdom & EU (International)", taxType: "VAT", rate: 20, igstRate: 0, notes: "Standard VAT applied on non-LUT international consignments" },
  ],
  categoryTaxRates: [
    { categoryId: "cat_lehengas", categoryName: "Designer Lehengas", hsnCode: "6204", standardRate: 12, luxuryThresholdAmount: 10000, luxuryThresholdRate: 18 },
    { categoryId: "cat_sarees", categoryName: "Heritage & Banarasi Sarees", hsnCode: "6204", standardRate: 12, luxuryThresholdAmount: 10000, luxuryThresholdRate: 18 },
    { categoryId: "cat_suits", categoryName: "Royal Anarkalis & Suits", hsnCode: "6204", standardRate: 12, luxuryThresholdAmount: 10000, luxuryThresholdRate: 18 },
    { categoryId: "cat_accessories", categoryName: "Artisanal Jewelry & Clutches", hsnCode: "7117", standardRate: 18 },
    { categoryId: "cat_swatches", categoryName: "Fabric Samples & Trims", hsnCode: "5407", standardRate: 5 },
  ],
  exemptions: [
    {
      id: "ex_101",
      customerName: "Radhika Mehra",
      customerEmail: "radhika.wholesale@boutiqueindia.com",
      businessName: "Mehra Luxury Bridal Boutique Ltd",
      gstinOrTaxId: "27AABCM8765P1Z1",
      exemptionType: "B2B_WHOLESALE",
      active: true,
      validUntil: "2027-03-31",
    },
    {
      id: "ex_102",
      customerName: "Vikram Singhania",
      customerEmail: "singhania.dubai@coutureexports.ae",
      businessName: "Singhania Overseas SEZ Trading",
      gstinOrTaxId: "07AAACS1234K1Z0",
      exemptionType: "SEZ_EXPORT",
      active: true,
      validUntil: "2026-12-31",
    },
  ],
  nexusThresholds: [
    { jurisdiction: "Delhi NCT", statutoryLimit: 4000000, currentVolume: 1240000, ordersCount: 42, status: "SAFE" },
    { jurisdiction: "Maharashtra (Mumbai / Pune)", statutoryLimit: 2000000, currentVolume: 1680000, ordersCount: 29, status: "APPROACHING" },
    { jurisdiction: "Karnataka (Bengaluru)", statutoryLimit: 2000000, currentVolume: 920000, ordersCount: 16, status: "SAFE" },
    { jurisdiction: "Gujarat (Ahmedabad / Surat)", statutoryLimit: 2000000, currentVolume: 410000, ordersCount: 8, status: "SAFE" },
  ],
};

function getTaxHubData(): TaxHubData {
  try {
    if (fs.existsSync(TAX_FILE_PATH)) {
      const content = fs.readFileSync(TAX_FILE_PATH, "utf-8");
      return { ...defaultTaxHubData, ...JSON.parse(content) };
    }
  } catch (err) {
    console.error("Error reading tax hub data:", err);
  }
  return defaultTaxHubData;
}

function saveTaxHubData(data: TaxHubData) {
  const dir = path.dirname(TAX_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TAX_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const taxData = getTaxHubData();
  return NextResponse.json({ success: true, ...taxData });
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentData = getTaxHubData();

    if (body.action === "update_category_rates") {
      currentData.categoryTaxRates = body.categoryTaxRates;
    } else if (body.action === "update_jurisdiction_rules") {
      currentData.jurisdictionRules = body.jurisdictionRules;
    } else if (body.action === "add_exemption") {
      const newExemption = {
        id: `ex_${Date.now()}`,
        customerName: body.exemption.customerName,
        customerEmail: body.exemption.customerEmail,
        businessName: body.exemption.businessName,
        gstinOrTaxId: body.exemption.gstinOrTaxId,
        exemptionType: body.exemption.exemptionType || "B2B_WHOLESALE",
        active: true,
        validUntil: body.exemption.validUntil || "2027-03-31",
      };
      currentData.exemptions.push(newExemption);
    } else if (body.action === "toggle_exemption") {
      const idx = currentData.exemptions.findIndex((e) => e.id === body.exemptionId);
      if (idx !== -1) {
        currentData.exemptions[idx].active = !currentData.exemptions[idx].active;
      }
    } else if (body.action === "delete_exemption") {
      currentData.exemptions = currentData.exemptions.filter((e) => e.id !== body.exemptionId);
    }

    saveTaxHubData(currentData);
    return NextResponse.json({ success: true, data: currentData });
  } catch (err: any) {
    console.error("Tax save error:", err);
    return NextResponse.json({ error: "Failed to save tax configuration." }, { status: 500 });
  }
}
