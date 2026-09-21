import { NextResponse } from "next/server";
import {
  getShowcaseCards,
  createShowcaseCard,
} from "@/lib/showcase";
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
    const cards = getShowcaseCards();
    return NextResponse.json({ success: true, cards });
  } catch (error) {
    console.error("ADMIN SHOWCASE GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load showcase." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const card = createShowcaseCard(body);
    return NextResponse.json({ success: true, card }, { status: 201 });
  } catch (error) {
    console.error("ADMIN SHOWCASE CREATE ERROR:", error);
    return NextResponse.json({ error: "Failed to create showcase card." }, { status: 500 });
  }
}
