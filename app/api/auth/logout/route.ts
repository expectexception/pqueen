import { NextResponse } from "next/server";
import { getCustomerSessionCookieName } from "@/lib/customer-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(getCustomerSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
