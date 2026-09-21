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
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        category: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          orderBy: { size: "asc" },
        },
      },
    });

    const inventoryList: any[] = [];

    products.forEach((p) => {
      p.variants.forEach((v) => {
        inventoryList.push({
          variantId: v.id,
          productId: p.id,
          productName: p.name,
          slug: p.slug,
          sku: p.sku,
          category: p.category?.name || "General",
          image: p.images[0]?.url || "",
          size: v.size,
          color: v.color || "Standard",
          stock: v.stock,
          price: Number(p.salePrice ?? p.price),
          status: p.status,
        });
      });
    });

    return NextResponse.json({
      success: true,
      inventory: inventoryList,
    });
  } catch (error) {
    console.error("ADMIN INVENTORY GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load inventory." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { variantId, stock } = body;

    if (!variantId || typeof stock !== "number" || stock < 0) {
      return NextResponse.json(
        { error: "Valid variantId and non-negative stock count are required." },
        { status: 400 }
      );
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.round(stock) },
    });

    return NextResponse.json({
      success: true,
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("ADMIN INVENTORY UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update stock." },
      { status: 500 }
    );
  }
}
