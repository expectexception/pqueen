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
    const { status } = body;

    if (!status || !["APPROVED", "PENDING", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error("ADMIN PATCH REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to update review status." }, { status: 500 });
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

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ADMIN DELETE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to delete review." }, { status: 500 });
  }
}
