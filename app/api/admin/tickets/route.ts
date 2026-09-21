import { NextResponse } from "next/server";
import { getAllTickets } from "@/lib/tickets";
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

  const tickets = getAllTickets();

  const metrics = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    underReview: tickets.filter((t) => t.status === "UNDER_REVIEW").length,
    refundApproved: tickets.filter((t) => t.status === "REFUND_APPROVED").length,
    refundProcessed: tickets.filter((t) => t.status === "REFUND_PROCESSED").length,
    closed: tickets.filter((t) => t.status === "CLOSED" || t.status === "RESOLVED").length,
    totalRefundAmount: tickets
      .filter((t) => t.refundAmount && (t.status === "REFUND_APPROVED" || t.status === "REFUND_PROCESSED"))
      .reduce((sum, t) => sum + (t.refundAmount || 0), 0),
  };

  return NextResponse.json({
    success: true,
    tickets,
    metrics,
  });
}
