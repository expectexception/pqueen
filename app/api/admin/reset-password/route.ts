import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAdminSession, getAdminSessionCookieName } from "@/lib/admin-auth";
import { verifyAndConsumeOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email and new password are required." },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json(
        { error: "6-digit admin security verification code is required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify 6-digit OTP for admin
    const otpVerification = await verifyAndConsumeOtp({
      email: cleanEmail,
      otp: String(otp).trim(),
      purpose: "ADMIN_FORGOT_PASSWORD",
    });

    if (!otpVerification.valid) {
      return NextResponse.json(
        { error: otpVerification.error || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    const cleanAlt1 = cleanEmail.replace(/^the/, "");
    const cleanAlt2 = `the${cleanEmail}`;
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: "insensitive" } },
          { email: { equals: cleanAlt1, mode: "insensitive" } },
          { email: { equals: cleanAlt2, mode: "insensitive" } },
        ],
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "No administrator account found with this email address." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    // Create admin session token so admin is signed in automatically
    const sessionToken = await createAdminSession(admin.id);

    const response = NextResponse.json({
      success: true,
      message: "Admin password successfully updated. Signing in...",
    });

    response.cookies.set({
      name: getAdminSessionCookieName(),
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("ADMIN RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reset admin password. Please try again." },
      { status: 500 }
    );
  }
}
