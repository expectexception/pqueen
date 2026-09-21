import { NextResponse } from "next/server";
import { getTicketById, updateTicket } from "@/lib/tickets";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = getTicketById(id);
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const updated = updateTicket(id, body);

    return NextResponse.json({
      success: true,
      ticket: updated,
    });
  } catch (error) {
    console.error("ADMIN TICKET UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update ticket." },
      { status: 500 }
    );
  }
}
