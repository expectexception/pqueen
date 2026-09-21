import { NextResponse } from "next/server";
import { getAllInquiries } from "@/lib/inquiries";
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
    const inquiries = getAllInquiries();
    const totalCount = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === "NEW").length;
    const inProgressCount = inquiries.filter((i) => i.status === "IN_PROGRESS").length;
    const resolvedCount = inquiries.filter((i) => i.status === "RESOLVED").length;

    return NextResponse.json({
      success: true,
      inquiries,
      metrics: {
        totalCount,
        newCount,
        inProgressCount,
        resolvedCount,
      },
    });
  } catch (error) {
    console.error("ADMIN GET INQUIRIES ERROR:", error);
    return NextResponse.json({ error: "Failed to load inquiries." }, { status: 500 });
  }
}
