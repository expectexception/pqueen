import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")[1];
}

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            sku: true,
            images: { take: 1 },
          },
        },
      },
    });

    const totalCount = reviews.length;
    const approvedCount = reviews.filter((r) => r.status === "APPROVED").length;
    const pendingCount = reviews.filter((r) => r.status === "PENDING").length;
    const averageRating =
      totalCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1))
        : 5.0;

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        totalCount,
        approvedCount,
        pendingCount,
        averageRating,
      },
    });
  } catch (error: any) {
    console.error("ADMIN GET REVIEWS ERROR:", error);
    return NextResponse.json({ error: "Failed to load reviews." }, { status: 500 });
  }
}
