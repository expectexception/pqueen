import fs from "fs";
import path from "path";

export type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number; // e.g. 10 (%) or 500 (₹)
  minOrderAmount: number;
  active: boolean;
  expiryDate?: string | null;
  description?: string;
};

// Default seed coupons
const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "coup-1",
    code: "PQN10",
    type: "PERCENT",
    value: 10,
    minOrderAmount: 0,
    active: true,
    description: "10% Off on all luxury Indian couture",
  },
  {
    id: "coup-2",
    code: "ROYAL20",
    type: "PERCENT",
    value: 20,
    minOrderAmount: 5000,
    active: true,
    description: "20% Off on orders above ₹5,000",
  },
  {
    id: "coup-3",
    code: "FESTIVE500",
    type: "FIXED",
    value: 500,
    minOrderAmount: 3000,
    active: true,
    description: "Flat ₹500 discount on festive ensembles above ₹3,000",
  },
];

const COUPONS_FILE = path.join(process.cwd(), "coupons-store.json");

function loadCoupons(): Coupon[] {
  try {
    if (fs.existsSync(COUPONS_FILE)) {
      const data = fs.readFileSync(COUPONS_FILE, "utf8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read coupons-store.json, using defaults:", err);
  }
  saveCoupons(DEFAULT_COUPONS);
  return DEFAULT_COUPONS;
}

function saveCoupons(coupons: Coupon[]): void {
  try {
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to coupons-store.json:", err);
  }
}

export function getAllCoupons(): Coupon[] {
  return loadCoupons();
}

export function getCouponByCode(code: string): Coupon | undefined {
  if (!code) return undefined;
  const coupons = loadCoupons();
  return coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
}

export function createCoupon(data: Omit<Coupon, "id">): Coupon {
  const coupons = loadCoupons();
  const newCoupon: Coupon = {
    id: `coup-${Date.now()}`,
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount || 0,
    active: data.active !== undefined ? data.active : true,
    expiryDate: data.expiryDate || null,
    description: data.description || "",
  };

  coupons.push(newCoupon);
  saveCoupons(coupons);
  return newCoupon;
}

export function updateCoupon(id: string, data: Partial<Coupon>): Coupon | null {
  const coupons = loadCoupons();
  const index = coupons.findIndex((c) => c.id === id);
  if (index === -1) return null;

  coupons[index] = {
    ...coupons[index],
    ...data,
    code: data.code ? data.code.trim().toUpperCase() : coupons[index].code,
  };

  saveCoupons(coupons);
  return coupons[index];
}

export function deleteCoupon(id: string): boolean {
  const coupons = loadCoupons();
  const initialLen = coupons.length;
  const filtered = coupons.filter((c) => c.id !== id);
  if (filtered.length < initialLen) {
    saveCoupons(filtered);
    return true;
  }
  return false;
}
