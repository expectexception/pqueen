import { NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/store-settings";

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

  const settings = await getStoreSettings();
  const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_FROM || "thep4rtyqueen@gmail.com").trim();
  const smtpHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const smtpPort = (process.env.SMTP_PORT || "465").trim();
  const smtpEnabled = process.env.SMTP_ENABLED !== "false";

  return NextResponse.json({
    success: true,
    settings: {
      ...settings,
      smtpUser,
      smtpHost,
      smtpPort,
      smtpEnabled,
    },
  });
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateStoreSettings(body);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error) {
    console.error("Failed to update store settings:", error);
    return NextResponse.json(
      { error: "Failed to update store settings." },
      { status: 500 }
    );
  }
}
