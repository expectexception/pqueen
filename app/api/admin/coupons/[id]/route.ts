import { NextResponse } from "next/server";
import { updateCoupon, deleteCoupon } from "@/lib/coupons";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const updated = updateCoupon(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update coupon." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const deleted = deleteCoupon(id);

    if (!deleted) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Coupon deleted." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
}
