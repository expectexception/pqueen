import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createCustomerSession, getCustomerSessionCookieName } from "@/lib/customer-auth";
import { sendWelcomeEmail } from "@/lib/email";
import { verifyAndConsumeOtp, normalizeIdentifier } from "@/lib/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, otp } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // 1. Verify 6-digit OTP
    if (!otp) {
      return NextResponse.json(
        { error: "6-digit verification code is required." },
        { status: 400 }
      );
    }

    // Check REGISTER first, then fallback to SIGNUP
    let otpVerification = await verifyAndConsumeOtp({
      identifier: cleanEmail,
      otp: String(otp).trim(),
      purpose: "REGISTER",
    });

    if (!otpVerification.valid) {
      otpVerification = await verifyAndConsumeOtp({
        identifier: cleanEmail,
        otp: String(otp).trim(),
        purpose: "SIGNUP",
      });
    }

    if (!otpVerification.valid) {
      return NextResponse.json(
        { error: otpVerification.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // 2. Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    let customer;
    if (existing) {
      if (existing.passwordHash) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      // If customer placed a guest order earlier, activate their account with password & verified timestamp
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          phone: cleanPhone || existing.phone,
          passwordHash,
          emailVerifiedAt: now,
          phoneVerifiedAt: cleanPhone ? now : existing.phoneVerifiedAt,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          emailVerifiedAt: now,
          phoneVerifiedAt: cleanPhone ? now : null,
        },
      });
    }

    // Send Welcome Email asynchronously
    sendWelcomeEmail({ email: cleanEmail, name: cleanName }).catch((err) => {
      console.warn("[Welcome Email Warning]:", err.message);
    });

    // Create session token
    const token = await createCustomerSession(customer.id);

    const response = NextResponse.json({
      success: true,
      message: "Account created and verified successfully!",
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        emailVerified: true,
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
    console.error("REGISTER API ERROR:", error.message);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}
