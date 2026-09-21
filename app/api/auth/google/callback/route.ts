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
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = getBaseUrl(request);

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent(error || "Google authorization was cancelled.")}`, baseUrl)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/account/login?error=Google+OAuth+client+secrets+not+configured+in+.env", baseUrl)
    );
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Google OAuth Token Error]:", errText);
      return NextResponse.redirect(new URL("/account/login?error=Failed+to+exchange+Google+token", baseUrl));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL("/account/login?error=Failed+to+fetch+Google+profile", baseUrl));
    }

    const profile = await profileRes.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || "PQN Member";
    const picture = profile.picture;
    const googleId = profile.sub;

    if (!email) {
      return NextResponse.redirect(new URL("/account/login?error=Google+profile+missing+email", baseUrl));
    }

    // 3. Upsert Customer in Database
    let isNewCustomer = false;
    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      isNewCustomer = true;
      customer = await prisma.customer.create({
        data: {
          email,
          name,
          avatar: picture,
          googleId,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          googleId: customer.googleId || googleId,
          avatar: customer.avatar || picture,
        },
      });
    }

    // 4. Send Welcome Email asynchronously
    if (isNewCustomer) {
      sendWelcomeEmail({ email: customer.email, name: customer.name }).catch((e) =>
        console.warn("[Welcome Email Error]:", e.message)
      );
    }

    // 5. Create Customer Session & Cookie
    const sessionToken = await createCustomerSession(customer.id);
    const redirectResponse = NextResponse.redirect(new URL("/account", baseUrl));

    redirectResponse.cookies.set(getCustomerSessionCookieName(), sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]:", err);
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent(err.message || "Google login failed")}`, baseUrl)
    );
  }
}
