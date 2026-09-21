import { NextResponse } from "next/server";
import {
  updateShowcaseCard,
  deleteShowcaseCard,
} from "@/lib/showcase";
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
    const updated = updateShowcaseCard(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Showcase card not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, card: updated });
  } catch (error) {
    console.error("ADMIN SHOWCASE UPDATE ERROR:", error);
    return NextResponse.json({ error: "Failed to update showcase card." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const deleted = deleteShowcaseCard(id);

    if (!deleted) {
      return NextResponse.json({ error: "Showcase card not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN SHOWCASE DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete showcase card." }, { status: 500 });
  }
}
