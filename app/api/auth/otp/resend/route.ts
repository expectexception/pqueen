import { NextResponse } from "next/server";
import { createAndSendOtp, normalizeIdentifier, OtpPurpose } from "@/lib/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.identifier || body.phone || body.email || body.destination;
    const { purpose, channel, name } = body;

    if (!rawId) {
      return NextResponse.json(
        { error: "A valid mobile number or email address is required." },
        { status: 400 }
      );
    }

    const normalized = normalizeIdentifier(rawId);
    const targetPurpose: OtpPurpose = (purpose || "LOGIN").toUpperCase() as OtpPurpose;

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await createAndSendOtp({
      identifier: normalized.value,
      purpose: targetPurpose,
      channel,
      name,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to resend verification code.", cooldownSeconds: result.cooldownSeconds },
        { status: result.cooldownSeconds ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedDestination: result.maskedDestination,
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      message: "A fresh verification code has been dispatched.",
    });
  } catch (error: any) {
    console.error("OTP RESEND API ERROR:", error.message);
    return NextResponse.json(
      { error: "Unable to resend verification code. Please try again." },
      { status: 500 }
    );
  }
}
