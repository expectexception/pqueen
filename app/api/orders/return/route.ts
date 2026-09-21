import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";
import { getCustomerSessionCookieName, verifyCustomerSession } from "@/lib/customer-auth";
import { evaluateReturnEligibility } from "@/lib/return-policy";
import { sendOrderStatusUpdateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAdminToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

function getCustomerToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${getCustomerSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function POST(request: Request) {
  try {
    const adminToken = getAdminToken(request);
    const isAdmin = await verifyAdminSession(adminToken);

    const customerToken = getCustomerToken(request);
    const customerId = await verifyCustomerSession(customerToken);

    if (!isAdmin && !customerId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to submit a return request." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, reason, returnType } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (!isAdmin && order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only request returns for your own orders." },
        { status: 403 }
      );
    }

    // STRICT 5-DAY RETURN WINDOW ENFORCEMENT
    const returnCheck = evaluateReturnEligibility(order);

    if (!returnCheck.isEligible) {
      return NextResponse.json(
        {
          success: false,
          error: returnCheck.message,
          returnEligibility: returnCheck,
        },
        { status: 400 }
      );
    }

    const returnReasonText = reason?.trim() || (returnType === "SIZE_EXCHANGE" ? "Size Exchange Requested" : "Standard 5-Day Return & Refund");

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        returnRequestedAt: new Date(),
        returnReason: returnReasonText,
        returnStatus: "RETURN_REQUESTED",
        status: "RETURNED",
      },
      include: { customer: true, items: true },
    });

    // Notify customer
    if (order.customer?.email) {
      sendOrderStatusUpdateEmail({
        email: order.customer.email,
        name: order.customer.name || order.shippingName,
        orderNumber: order.orderNumber,
        status: "RETURNED",
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Return request registered under 5-day policy. Our courier concierge will schedule reverse pickup.`,
      order: updatedOrder,
      returnEligibility: returnCheck,
    });
  } catch (err: any) {
    console.error("RETURN API ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process return request." },
      { status: 500 }
    );
  }
}
