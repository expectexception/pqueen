import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCustomerSessionCookieName,
  verifyCustomerSession,
} from "@/lib/customer-auth";

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

export async function GET(request: Request) {
  try {
    const token = getCustomerTokenFromRequest(request);
    const customerId = await verifyCustomerSession(token);

    if (!customerId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        googleId: customer.googleId,
        bustSize: customer.bustSize,
        waistSize: customer.waistSize,
        hipSize: customer.hipSize,
        height: customer.height,
        addresses: customer.addresses,
        createdAt: customer.createdAt,
        orders: customer.orders,
      },
    });
  } catch (error) {
    console.error("CUSTOMER ME ERROR:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
