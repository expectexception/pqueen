import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerSession, getCustomerSessionCookieName } from "@/lib/customer-auth";
import { sendWelcomeEmail } from "@/lib/email";

function getBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost || request.headers.get("host") || "").split(",")[0].trim();
  const rawProto = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  const proto = rawProto === "http" || rawProto === "https" ? rawProto : (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

  if (host) {
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://pqnpartyqueen.com";
}


export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId) {
    // If not configured, redirect to login with helpful error message
    return NextResponse.redirect(
      new URL("/account/login?error=Google+OAuth+not+configured.+Please+set+GOOGLE_CLIENT_ID+in+.env", baseUrl)
    );
  }

  const state = Math.random().toString(36).substring(2, 15);
  const scope = encodeURIComponent("openid email profile");

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}

/**
 * Direct ID-Token handler for Google One-Tap or Google Identity Services
 */
export async function POST(request: Request) {
  try {
    const { idToken, userInfo } = await request.json();

    let email = userInfo?.email;
    let name = userInfo?.name || "PQN Member";
    let picture = userInfo?.picture;
    let googleId = userInfo?.sub;

    if (!email && idToken) {
      // Decode JWT payload without external library
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        email = payload.email;
        name = payload.name || name;
        picture = payload.picture || picture;
        googleId = payload.sub || googleId;
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Missing verified Google email." }, { status: 400 });
    }

    // Find or create customer
    let isNewCustomer = false;
    let customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      isNewCustomer = true;
      customer = await prisma.customer.create({
        data: {
          email: email.toLowerCase(),
          name,
          avatar: picture,
          googleId,
        },
      });
    } else if (!customer.googleId || !customer.avatar) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          googleId: customer.googleId || googleId,
          avatar: customer.avatar || picture,
        },
      });
    }

    // Send Welcome email for new member
    if (isNewCustomer) {
      sendWelcomeEmail({ email: customer.email, name: customer.name }).catch((e) =>
        console.warn("[Welcome Email Error]:", e.message)
      );
    }

    // Create session
    const sessionToken = await createCustomerSession(customer.id);
    const response = NextResponse.json({
      success: true,
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        avatar: customer.avatar,
      },
    });

    response.cookies.set(getCustomerSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("GOOGLE AUTH POST ERROR:", error);
    return NextResponse.json({ error: error.message || "Google authentication failed" }, { status: 500 });
  }
}
