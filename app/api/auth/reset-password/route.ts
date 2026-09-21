import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createCustomerSession, getCustomerSessionCookieName } from "@/lib/customer-auth";
import { verifyAndConsumeOtp, normalizeIdentifier } from "@/lib/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.identifier || body.email || body.phone;
    const { otp, newPassword } = body;

    if (!rawId || !newPassword) {
      return NextResponse.json(
        { error: "Account identifier and new password are required." },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { error: "6-digit verification code is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalized = normalizeIdentifier(rawId);

    // 1. Verify 6-digit OTP
    const otpVerification = await verifyAndConsumeOtp({
      identifier: normalized.value,
      otp: String(otp).trim(),
      purpose: "FORGOT_PASSWORD",
    });

    if (!otpVerification.valid) {
      return NextResponse.json(
        {
          error: otpVerification.error || "Invalid or expired verification code.",
          attemptsRemaining: otpVerification.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    // 2. Find customer
    let customer: any = null;
    if (normalized.type === "email") {
      customer = await prisma.customer.findUnique({
        where: { email: normalized.value },
      });
    } else {
      customer = await prisma.customer.findFirst({
        where: { phone: { contains: normalized.value } },
      });
    }

    if (!customer) {
      return NextResponse.json(
        { error: "No account found matching this identifier." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        emailVerifiedAt: normalized.type === "email" ? now : customer.emailVerifiedAt,
        phoneVerifiedAt: normalized.type === "phone" ? now : customer.phoneVerifiedAt,
      },
    });

    // 3. Create session token
    const token = await createCustomerSession(updatedCustomer.id);

    const response = NextResponse.json({
      success: true,
      message: "Password reset successful! You are now logged in.",
      user: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
      },
    });

    response.cookies.set(getCustomerSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("RESET PASSWORD API ERROR:", error.message);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
