import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import {
  getCustomerSessionCookieName,
  verifyCustomerSession,
} from "@/lib/customer-auth";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminNewOrderNotificationEmail,
} from "@/lib/email";
import { ShippingEngine } from "@/lib/shipping/engine";
import { getCouponByCode } from "@/lib/coupons";
import { evaluateReturnEligibility } from "@/lib/return-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function getCustomerTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getCustomerSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

async function requireAdmin(request: Request): Promise<boolean> {
  const token = getAdminTokenFromRequest(request);
  return verifyAdminSession(token);
}

/* =========================================================
   CREATE ORDER (PUBLIC)
   ========================================================= */

export async function POST(request: Request) {
  try {
    // 1. Strict Customer Authentication Enforcement
    const customerToken = getCustomerTokenFromRequest(request);
    const verifiedCustomerId = await verifyCustomerSession(customerToken);

    if (!verifiedCustomerId) {
      return NextResponse.json(
        {
          error: "Account verification required. Please sign in or create an account with OTP to complete your order.",
        },
        { status: 401 }
      );
    }

    // 2. Find authenticated customer in database
    let customer = await prisma.customer.findUnique({
      where: {
        id: verifiedCustomerId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          error: "Customer account session expired. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      items,
    } = body;


    // Basic validation
    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Please provide all required delivery and contact details.",
        },
        { status: 400 }
      );
    }

    // Get product IDs from cart
    const productIds = items.map((item: any) => item.productId);

    // Find products in database
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    // Make sure every product exists
    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error: "One or more products in your cart could not be found.",
        },
        { status: 400 }
      );
    }

    // Calculate total using database prices
    let totalAmount = 0;

    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error("Product not found.");
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error("Invalid product quantity.");
      }

      const price = product.salePrice ?? product.price;
      totalAmount += Number(price) * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        size: item.size || null,
        color: item.color || null, // FIXED: Properly saved color!
        quantity: item.quantity,
        price,
      };
    });

    // Check and apply promotional voucher discount if provided
    let discountAmount = 0;
    const couponCode = body.couponCode?.trim()?.toUpperCase();
    if (couponCode) {
      const coupon = getCouponByCode(couponCode);
      if (coupon && coupon.active) {
        if (coupon.minOrderAmount === 0 || totalAmount >= coupon.minOrderAmount) {
          if (coupon.type === "PERCENT") {
            discountAmount = Math.round((totalAmount * coupon.value) / 100);
          } else {
            discountAmount = Math.min(totalAmount, coupon.value);
          }
        }
      }
    }

    const finalGrandTotal = Math.max(0, totalAmount - discountAmount);

    // Update customer profile with latest name/phone
    customer = await prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        name: name.trim() || customer.name,
        phone: phone.trim() || customer.phone,
      },
    });


    // Determine payment method and status
    const incomingMethod = (body.paymentMethod || "ONLINE").toUpperCase();
    const isCod = incomingMethod === "COD";
    const paymentMethod = isCod ? "COD" : "ONLINE";
    const paymentStatus = isCod ? "PENDING" : "PAID";
    const razorpayPaymentId = body.razorpayPaymentId || null;
    const razorpayOrderId = body.razorpayOrderId || null;

    // 1. IDEMPOTENCY GUARD: Check if order with this Razorpay payment ID already exists
    if (razorpayPaymentId) {
      const existingPaidOrder = await prisma.order.findFirst({
        where: { razorpayPaymentId },
        include: { items: true, customer: true }
      });
      if (existingPaidOrder) {
        console.log(`[Orders API] Duplicate payment submission detected for ${razorpayPaymentId}. Reusing existing order ${existingPaidOrder.orderNumber}.`);
        return NextResponse.json({
          success: true,
          isDuplicate: true,
          order: {
            id: existingPaidOrder.id,
            orderNumber: existingPaidOrder.orderNumber,
            totalAmount: existingPaidOrder.totalAmount,
          },
          fulfillment: existingPaidOrder.awbNumber ? {
            success: true,
            awbNumber: existingPaidOrder.awbNumber,
            courierName: existingPaidOrder.courierName,
            stockVerified: true,
            pickupScheduled: true,
            labelUrl: existingPaidOrder.shippingLabelUrl
          } : undefined
        });
      }
    }

    // 2. IDEMPOTENCY GUARD: Rapid double-submission protection within 30 seconds
    const recentWindow = new Date(Date.now() - 30 * 1000);
    const recentDuplicate = await prisma.order.findFirst({
      where: {
        customerId: customer.id,
        shippingPincode: pincode,
        createdAt: { gte: recentWindow },
        totalAmount: finalGrandTotal,
      },
      include: { items: true }
    });

    if (recentDuplicate) {
      console.log(`[Orders API] Rapid duplicate order submission within 30s detected for customer ${customer.id}. Reusing order ${recentDuplicate.orderNumber}.`);
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        order: {
          id: recentDuplicate.id,
          orderNumber: recentDuplicate.orderNumber,
          totalAmount: recentDuplicate.totalAmount,
        },
        fulfillment: recentDuplicate.awbNumber ? {
          success: true,
          awbNumber: recentDuplicate.awbNumber,
          courierName: recentDuplicate.courierName,
          stockVerified: true,
          labelUrl: recentDuplicate.shippingLabelUrl
        } : undefined
      });
    }

    // Generate unique order number
    const orderNumber = `PQN-${Date.now()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        totalAmount: finalGrandTotal,

        shippingName: name,
        shippingPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingPincode: pincode,

        paymentMethod,
        paymentStatus,
        razorpayPaymentId,
        razorpayOrderId,

        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Trigger Automated End-to-End Shipping & Fulfillment
    // (1. Stock Deduction, 2. Best Carrier Selection by Rate & TAT, 3. API Dispatch & AWB Generation, 4. Warehouse Pickup Booking)
    let fulfillmentResult: any = null;
    try {
      fulfillmentResult = await ShippingEngine.getInstance().autoFulfillOrder(order.id);
    } catch (fulfillErr: any) {
      console.warn("[Automated Order Fulfillment Warning]:", fulfillErr.message);
    }

    const assignedCourier = fulfillmentResult?.courierSelected?.courierName || fulfillmentResult?.shipment?.courierName;
    const assignedAwb = fulfillmentResult?.shipment?.awbNumber;

    // Send Luxury Order Confirmation & Invoice Email asynchronously to customer
    sendOrderConfirmationEmail({
      email: customer.email,
      name: customer.name,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount.toString(),
      items: order.items.map((i) => ({
        productName: i.productName,
        size: i.size,
        quantity: i.quantity,
        price: i.price.toString(),
      })),
      shippingAddress: `${name}, ${address}, ${city}, ${state} - ${pincode}`,
      courierName: assignedCourier,
      awbNumber: assignedAwb,
    }).catch((e) => console.warn("[Order Confirmation Email Error]:", e.message));

    // Send Instant Alert to Store Owner / Atelier Manager asynchronously
    sendAdminNewOrderNotificationEmail({
      orderNumber: order.orderNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || phone,
      totalAmount: order.totalAmount.toString(),
      shippingAddress: `${address}, ${city}`,
      shippingCity: city,
      shippingState: state,
      itemsCount: order.items.reduce((s, it) => s + it.quantity, 0),
    }).catch((e) => console.warn("[Admin Order Alert Email Error]:", e.message));

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      },
      fulfillment: fulfillmentResult ? {
        success: fulfillmentResult.success,
        awbNumber: assignedAwb,
        courierName: assignedCourier,
        stockVerified: fulfillmentResult.stockVerified,
        pickupScheduled: Boolean(fulfillmentResult.pickup?.success),
        labelUrl: fulfillmentResult.shipment?.labelUrl
      } : undefined
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the order.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET ALL ORDERS (ADMIN ONLY)
   ========================================================= */

export async function GET(request: Request) {
  const valid = await requireAdmin(request);
  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized access to customer orders." },
      { status: 401 }
    );
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load orders.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE ORDER STATUS (ADMIN ONLY)
   ========================================================= */

export async function PATCH(request: Request) {
  const valid = await requireAdmin(request);
  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        {
          error: "Order ID and status are required.",
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (status === "CANCELLED") {
      const cancelResult = await ShippingEngine.getInstance().cancelOrderShipment(orderId, "Admin Status Update");
      if (!cancelResult.success) {
        return NextResponse.json(
          { error: cancelResult.message || cancelResult.error || "Cannot cancel order." },
          { status: 400 }
        );
      }
      const cancelledOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true, items: true },
      });
      return NextResponse.json({
        success: true,
        message: cancelResult.message,
        order: cancelledOrder,
      });
    }

    // STRICT 5-DAY RETURN WINDOW POLICY VALIDATION
    if (status === "RETURNED") {
      const returnCheck = evaluateReturnEligibility(existingOrder);
      if (!returnCheck.isEligible) {
        return NextResponse.json(
          {
            error: `Return processing blocked: ${returnCheck.message}`,
            returnEligibility: returnCheck,
          },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        ...(status === "DELIVERED" && !existingOrder.deliveredAt ? { deliveredAt: new Date() } : {}),
        ...(status === "RETURNED" && !existingOrder.returnRequestedAt ? { returnRequestedAt: new Date(), returnStatus: "RETURN_APPROVED" } : {}),
      },
      include: {
        customer: true,
      },
    });

    // Automatically notify customer of fulfillment milestone update (Processing, Shipped with AWB, Delivered, etc.)
    if (order.customer?.email) {
      sendOrderStatusUpdateEmail({
        email: order.customer.email,
        name: order.customer.name || order.shippingName,
        orderNumber: order.orderNumber,
        status: order.status,
      }).catch((e) => console.warn("[Status Update Notification Error]:", e.message));
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to update order status.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE / REMOVE ORDER (ADMIN ONLY)
   ========================================================= */
export async function DELETE(request: Request) {
  const valid = await requireAdmin(request);
  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let orderId = searchParams.get("orderId") || searchParams.get("id");

    if (!orderId) {
      try {
        const body = await request.json();
        orderId = body.orderId || body.id;
      } catch {}
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required to remove order." },
        { status: 400 }
      );
    }

    // Delete order items then order
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({
      success: true,
      message: "Order removed successfully from records.",
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    return NextResponse.json(
      { error: "Unable to remove order. Please try again." },
      { status: 500 }
    );
  }
}