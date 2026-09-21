import { NextResponse } from "next/server";
import { getCouponByCode } from "@/lib/coupons";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, cartSubtotal } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Please enter a voucher code." }, { status: 400 });
    }

    const coupon = getCouponByCode(code.trim());

    if (!coupon || !coupon.active) {
      return NextResponse.json(
        { error: "Invalid or expired promotional voucher." },
        { status: 404 }
      );
    }

    const subtotal = Number(cartSubtotal || 0);

    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `This voucher requires a minimum order value of ₹${coupon.minOrderAmount.toLocaleString("en-IN")}.`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENT") {
      discountAmount = Math.round((subtotal * coupon.value) / 100);
    } else {
      discountAmount = Math.min(subtotal, coupon.value);
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        discountAmount,
      },
    });
  } catch (error: any) {
    console.error("COUPON VALIDATION ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to validate voucher." },
      { status: 500 }
    );
  }
}
