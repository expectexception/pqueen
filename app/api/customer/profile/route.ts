import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  getCustomerSessionCookieName,
  verifyCustomerSession,
} from "@/lib/customer-auth";

function getCustomerId(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${getCustomerSessionCookieName()}=`))
    ?.split("=")[1];
  return verifyCustomerSession(token);
}

export async function GET(request: Request) {
  try {
    const customerId = await getCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: {
          orderBy: { createdAt: "desc" },
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
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      customer: {
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
        orders: customer.orders,
        createdAt: customer.createdAt,
      },
    });
  } catch (error: any) {
    console.error("CUSTOMER PROFILE GET ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const customerId = await getCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar, bustSize, waistSize, hipSize, height, currentPassword, newPassword } = body;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bustSize !== undefined) updateData.bustSize = bustSize;
    if (waistSize !== undefined) updateData.waistSize = waistSize;
    if (hipSize !== undefined) updateData.hipSize = hipSize;
    if (height !== undefined) updateData.height = height;

    // Handle password update if requested
    if (newPassword) {
      if (customer.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(currentPassword, customer.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
        }
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
      include: {
        addresses: true,
        orders: {
          include: { items: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        avatar: updated.avatar,
        bustSize: updated.bustSize,
        waistSize: updated.waistSize,
        hipSize: updated.hipSize,
        height: updated.height,
        addresses: updated.addresses,
        orders: updated.orders,
      },
    });
  } catch (error: any) {
    console.error("CUSTOMER PROFILE PATCH ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
