import { NextResponse } from "next/server";
import { verifyAndConsumeOtp, normalizeIdentifier, OtpPurpose } from "@/lib/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.identifier || body.phone || body.email || body.destination;
    const { otp, purpose } = body;

    if (!rawId || !otp) {
      return NextResponse.json(
        { error: "Mobile number/email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const normalized = normalizeIdentifier(rawId);
    const targetPurpose: OtpPurpose = (purpose || "LOGIN").toUpperCase() as OtpPurpose;

    const result = await verifyAndConsumeOtp({
      identifier: normalized.value,
      otp: String(otp).trim(),
      purpose: targetPurpose,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          error: result.error || "Invalid or expired verification code.",
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code validated successfully.",
    });
  } catch (error: any) {
    console.error("OTP VERIFY API ERROR:", error.message);
    return NextResponse.json(
      { error: "Failed to verify code. Please try again." },
      { status: 500 }
    );
  }
}
