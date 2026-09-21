import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { sendTestEmail } from "@/lib/email";

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

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const recipient = (body.toEmail || process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || "thep4rtyqueen@gmail.com").trim();

    const result = await sendTestEmail({ toEmail: recipient });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email successfully dispatched to ${recipient}!`,
        simulated: result.simulated ?? false,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to dispatch test email." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send test email." },
      { status: 500 }
    );
  }
}
