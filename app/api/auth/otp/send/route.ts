import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp, normalizeIdentifier, OtpPurpose } from "@/lib/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.identifier || body.phone || body.email || body.destination;
    const { purpose, name, channel } = body;

    if (!rawId || typeof rawId !== "string") {
      return NextResponse.json(
        { error: "A valid mobile number or email address is required." },
        { status: 400 }
      );
    }

    const normalized = normalizeIdentifier(rawId);

    if (normalized.type === "phone" && normalized.value.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (normalized.type === "email" && (!normalized.value.includes("@") || !normalized.value.includes("."))) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const validPurposes: OtpPurpose[] = [
      "REGISTER",
      "SIGNUP",
      "FORGOT_PASSWORD",
      "LOGIN",
      "ADMIN_FORGOT_PASSWORD",
      "CHANGE_EMAIL",
      "CHANGE_PHONE",
    ];

    const targetPurpose: OtpPurpose = (purpose || "LOGIN").toUpperCase() as OtpPurpose;

    if (!validPurposes.includes(targetPurpose)) {
      return NextResponse.json(
        { error: "Invalid OTP purpose specified." },
        { status: 400 }
      );
    }

    // Purpose-specific pre-checks
    if (targetPurpose === "REGISTER" || targetPurpose === "SIGNUP") {
      if (normalized.type === "email") {
        const existingCustomer = await prisma.customer.findUnique({
          where: { email: normalized.value },
        });
        if (existingCustomer && existingCustomer.passwordHash) {
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in." },
            { status: 409 }
          );
        }
      }
    } else if (targetPurpose === "ADMIN_FORGOT_PASSWORD") {
      const clean = normalized.value.trim().toLowerCase();
      const cleanAlt1 = clean.replace(/^the/, "");
      const cleanAlt2 = `the${clean}`;
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: { equals: clean, mode: "insensitive" } },
            { email: { equals: cleanAlt1, mode: "insensitive" } },
            { email: { equals: cleanAlt2, mode: "insensitive" } },
          ],
        },
      });
      if (!admin) {
        return NextResponse.json(
          { error: "No administrator account is registered with this email address." },
          { status: 404 }
        );
      }
    }

    // Forward IP and User-Agent for audit tracking
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await createAndSendOtp({
      identifier: normalized.value,
      purpose: targetPurpose,
      channel,
      name: name || undefined,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to dispatch verification code.", cooldownSeconds: result.cooldownSeconds },
        { status: result.cooldownSeconds ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedDestination: result.maskedDestination,
      cooldownSeconds: result.cooldownSeconds,
      expiresInSeconds: result.expiresInSeconds,
      message: result.message,
    });
  } catch (error: any) {
    console.error("OTP SEND API ERROR:", error.message);
    return NextResponse.json(
      { error: "Unable to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
