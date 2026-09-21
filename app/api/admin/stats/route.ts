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
    const [
      orders,
      products,
      customersCount,
      recentOrders,
      variants,
    ] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          status: true,
          totalAmount: true,
        },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          status: true,
          name: true,
        },
      }),
      prisma.customer.count(),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.productVariant.findMany({
        where: {
          stock: { lte: 5 },
        },
        include: {
          product: {
            select: { name: true, slug: true },
          },
        },
        take: 10,
      }),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const validOrdersCount = orders.filter(
      (o) => o.status !== "CANCELLED" && o.status !== "RETURNED"
    ).length;

    const avgOrderValue = validOrdersCount > 0 ? Math.round(totalRevenue / validOrdersCount) : 0;

    const statusCounts = {
      pending: orders.filter((o) => o.status === "PENDING").length,
      confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
      processing: orders.filter((o) => o.status === "PROCESSING").length,
      shipped: orders.filter((o) => o.status === "SHIPPED").length,
      delivered: orders.filter((o) => o.status === "DELIVERED").length,
      cancelled: orders.filter((o) => o.status === "CANCELLED").length,
      returned: orders.filter((o) => o.status === "RETURNED").length,
    };

    const activeProductsCount = products.filter((p) => p.status === "ACTIVE").length;
    const draftProductsCount = products.filter((p) => p.status === "DRAFT").length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue,
        totalProducts: products.length,
        activeProductsCount,
        draftProductsCount,
        totalCustomers: customersCount,
        statusCounts,
      },
      recentOrders,
      lowStockVariants: variants.map((v) => ({
        id: v.id,
        productName: v.product.name,
        slug: v.product.slug,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard metrics." },
      { status: 500 }
    );
  }
}
