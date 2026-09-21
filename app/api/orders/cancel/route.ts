import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";
import { getCustomerSessionCookieName, verifyCustomerSession } from "@/lib/customer-auth";
import { ShippingEngine } from "@/lib/shipping/engine";
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
        { success: false, error: "Authentication required to cancel an order." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, reason } = body;

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

    // If not admin, ensure customer owns this order
    if (!isAdmin && order.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only cancel your own orders." },
        { status: 403 }
      );
    }

    const cancelReason = isAdmin
      ? `Admin Cancellation: ${reason || "Admin request"}`
      : `Customer Cancellation: ${reason || "Customer requested cancellation"}`;

    const result = await ShippingEngine.getInstance().cancelOrderShipment(order.id, cancelReason);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || result.error || "Failed to cancel order with iThink Logistics.",
        },
        { status: 400 }
      );
    }

    // Send status update notification email
    if (order.customer?.email) {
      sendOrderStatusUpdateEmail({
        email: order.customer.email,
        name: order.customer.name || order.shippingName,
        orderNumber: order.orderNumber,
        status: "CANCELLED",
      }).catch((e) => console.warn("[Cancellation Email Notice]:", e.message));
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { customer: true, items: true },
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      walletRefundLogged: result.walletRefundLogged,
      refundAmount: result.refundAmount,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("ORDER CANCEL API ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process cancellation request." },
      { status: 500 }
    );
  }
}
