import { NextResponse } from "next/server";
import { updateInquiry, deleteInquiry } from "@/lib/inquiries";
import { getAdminSessionCookieName, verifyAdminSession } from "@/lib/admin-auth";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")[1];
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const params = await props.params;
    const { id } = params;
    const body = await request.json();

    const updated = updateInquiry(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("ADMIN PATCH INQUIRY ERROR:", error);
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const params = await props.params;
    const { id } = params;

    const deleted = deleteInquiry(id);
    if (!deleted) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN DELETE INQUIRY ERROR:", error);
    return NextResponse.json({ error: "Failed to delete inquiry." }, { status: 500 });
  }
}
