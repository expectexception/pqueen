import { NextResponse } from "next/server";
import { createInquiry, getInquiriesByCustomer } from "@/lib/inquiries";
import { getCustomerSessionCookieName, verifyCustomerSession } from "@/lib/customer-auth";

function getCustomerTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${getCustomerSessionCookieName()}=`))
    ?.split("=")[1];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let email = searchParams.get("email");

    const token = getCustomerTokenFromRequest(request);
    const customerId = await verifyCustomerSession(token);

    if (customerId) {
      const { prisma } = await import("@/lib/prisma");
      const cust = await prisma.customer.findUnique({ where: { id: customerId } });
      if (cust?.email) email = cust.email;
    }

    if (!email) {
      return NextResponse.json({ inquiries: [] });
    }

    const inquiries = getInquiriesByCustomer(email);
    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error("GET INQUIRIES ERROR:", error);
    return NextResponse.json({ error: "Failed to load inquiries." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productId,
      productName,
      customerName,
      customerEmail,
      customerPhone,
      category,
      subject,
      message,
      attachments,
    } = body;

    if (!customerName || !customerEmail || !category || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill all required inquiry fields (Name, Email, Category, Subject, Message)." },
        { status: 400 }
      );
    }

    const newInquiry = createInquiry({
      productId,
      productName,
      customerName,
      customerEmail,
      customerPhone,
      category,
      subject,
      message,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    return NextResponse.json({
      success: true,
      inquiry: newInquiry,
      message: `Inquiry #${newInquiry.inquiryNumber} received. Our styling concierge will contact you via WhatsApp / Email shortly.`,
    });
  } catch (error) {
    console.error("POST INQUIRY ERROR:", error);
    return NextResponse.json({ error: "Failed to submit inquiry." }, { status: 500 });
  }
}
