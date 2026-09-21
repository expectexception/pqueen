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
    const rawId = body.identifier || body.phone || body.email;
    const { password, otp, isOtpLogin } = body;

    if (!rawId) {
      return NextResponse.json(
        { error: "Mobile number or email address is required." },
        { status: 400 }
      );
    }

    const normalized = normalizeIdentifier(rawId);
    let customer: any = null;
    const now = new Date();

    // 1. OTP-based Instant Passwordless Login
    if (isOtpLogin || otp) {
      if (!otp) {
        return NextResponse.json(
          { error: "6-digit verification code is required." },
          { status: 400 }
        );
      }

      const otpVerification = await verifyAndConsumeOtp({
        identifier: normalized.value,
        otp: String(otp).trim(),
        purpose: "LOGIN",
      });

      if (!otpVerification.valid) {
        return NextResponse.json(
          {
            error: otpVerification.error || "Invalid or expired verification code.",
            attemptsRemaining: otpVerification.attemptsRemaining,
          },
          { status: 401 }
        );
      }

      // Lookup or auto-provision customer account
      if (normalized.type === "phone") {
        customer = await prisma.customer.findFirst({
          where: {
            phone: { contains: normalized.value },
          },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name: "Valued Customer",
              phone: normalized.value,
              email: `user_${normalized.value}@pqnpartyqueen.com`,
              phoneVerifiedAt: now,
            },
          });
        } else if (!customer.phoneVerifiedAt) {
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: { phoneVerifiedAt: now },
          });
        }
      } else {
        customer = await prisma.customer.findUnique({
          where: { email: normalized.value },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name: normalized.value.split("@")[0] || "Valued Customer",
              email: normalized.value,
              emailVerifiedAt: now,
            },
          });
        } else if (!customer.emailVerifiedAt) {
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: { emailVerifiedAt: now },
          });
        }
      }
    } else {
      // 2. Standard Password Login
      if (!password) {
        return NextResponse.json(
          { error: "Password is required." },
          { status: 400 }
        );
      }

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
          { error: "No account found. Please sign up or use Instant OTP." },
          { status: 404 }
        );
      }

      if (!customer.passwordHash) {
        return NextResponse.json(
          { error: "This account does not have a password set. Please use Instant OTP or Google Login." },
          { status: 401 }
        );
      }

      const passwordMatches = await bcrypt.compare(password, customer.passwordHash);

      if (!passwordMatches) {
        return NextResponse.json(
          { error: "Invalid credentials. Please try again." },
          { status: 401 }
        );
      }
    }

    const token = await createCustomerSession(customer.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        emailVerified: Boolean(customer.emailVerifiedAt),
        phoneVerified: Boolean(customer.phoneVerifiedAt),
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
    console.error("LOGIN API ERROR:", error.message);
    return NextResponse.json(
      { error: "Unable to sign in. Please try again." },
      { status: 500 }
    );
  }
}
