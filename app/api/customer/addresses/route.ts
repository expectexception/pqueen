import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const addresses = await prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error("ADDRESSES GET ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to load addresses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const customerId = await getCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tag, name, phone, street, city, state, pincode, country, isDefault } = body;

    if (!name || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json({ error: "Please fill in all required address fields." }, { status: 400 });
    }

    // If marked as default, unset other default addresses for this customer
    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    // Check if this is the first address, make it default automatically
    const existingCount = await prisma.address.count({ where: { customerId } });
    const makeDefault = isDefault || existingCount === 0;

    const address = await prisma.address.create({
      data: {
        customerId,
        tag: tag || "Home",
        name: name.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country || "India",
        isDefault: makeDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error: any) {
    console.error("ADDRESS POST ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to create address" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const customerId = await getCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, tag, name, phone, street, city, state, pincode, country, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, customerId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        tag: tag !== undefined ? tag : existing.tag,
        name: name !== undefined ? name.trim() : existing.name,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        street: street !== undefined ? street.trim() : existing.street,
        city: city !== undefined ? city.trim() : existing.city,
        state: state !== undefined ? state.trim() : existing.state,
        pincode: pincode !== undefined ? pincode.trim() : existing.pincode,
        country: country !== undefined ? country : existing.country,
        isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error: any) {
    console.error("ADDRESS PATCH ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const customerId = await getCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id, customerId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (error: any) {
    console.error("ADDRESS DELETE ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to delete address" }, { status: 500 });
  }
}
