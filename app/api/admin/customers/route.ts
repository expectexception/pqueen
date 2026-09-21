import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const formatted = customers.map((c) => {
      const validOrders = c.orders.filter(
        (o) => o.status !== "CANCELLED" && o.status !== "RETURNED"
      );
      const totalSpent = validOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0
      );
      const lastOrder = c.orders.length > 0 ? c.orders[0].createdAt : null;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        hasAccount: Boolean(c.passwordHash),
        emailVerified: Boolean(c.emailVerifiedAt),
        phoneVerified: Boolean(c.phoneVerifiedAt),
        createdAt: c.createdAt,
        totalOrders: c.orders.length,
        totalSpent,
        lastOrderDate: lastOrder,
      };
    });

    return NextResponse.json({
      success: true,
      customers: formatted,
    });
  } catch (error) {
    console.error("ADMIN CUSTOMERS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load customers." },
      { status: 500 }
    );
  }
}
