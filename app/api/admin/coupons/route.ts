import { NextResponse } from "next/server";
import {
  getAllCoupons,
  createCoupon,
  getCouponByCode,
} from "@/lib/coupons";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

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

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    coupons: getAllCoupons(),
  });
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, type, value, minOrderAmount, active, expiryDate, description } = body;

    if (!code || !type || value === undefined || Number(value) <= 0) {
      return NextResponse.json(
        { error: "Valid code, type (PERCENT/FIXED), and positive value are required." },
        { status: 400 }
      );
    }

    const existing = getCouponByCode(code);
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists." },
        { status: 409 }
      );
    }

    const coupon = createCoupon({
      code,
      type: type === "FIXED" ? "FIXED" : "PERCENT",
      value: Number(value),
      minOrderAmount: Number(minOrderAmount || 0),
      active: active !== undefined ? Boolean(active) : true,
      expiryDate,
      description,
    });

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create coupon." },
      { status: 500 }
    );
  }
}
