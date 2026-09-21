import { NextResponse } from "next/server";
import {
  createTicket,
  getTicketsByCustomer,
  getAllTickets,
} from "@/lib/tickets";
import {
  getCustomerSessionCookieName,
  verifyCustomerSession,
} from "@/lib/customer-auth";
import { evaluateReturnEligibility } from "@/lib/return-policy";

function getCustomerTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getCustomerSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketNumber = searchParams.get("ticketNumber");
  let email = searchParams.get("email");

  if (ticketNumber) {
    const all = getAllTickets();
    const found = all.find(
      (t) =>
        t.ticketNumber.toLowerCase() === ticketNumber.trim().toLowerCase() ||
        t.id.toLowerCase() === ticketNumber.trim().toLowerCase()
    );
    if (found) {
      return NextResponse.json({ success: true, ticket: found });
    } else {
      return NextResponse.json({ error: "No complaint record found with this reference number." }, { status: 404 });
    }
  }

  const token = getCustomerTokenFromRequest(request);
  const customerId = await verifyCustomerSession(token);

  if (customerId) {
    const { prisma } = await import("@/lib/prisma");
    const cust = await prisma.customer.findUnique({ where: { id: customerId } });
    if (cust?.email) {
      email = cust.email;
    }
  }

  if (!email) {
    return NextResponse.json({ tickets: [] });
  }

  const tickets = getTicketsByCustomer(email);
  return NextResponse.json({ success: true, tickets });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      orderNumber,
      category,
      subject,
      description,
      attachments,
      priority,
    } = body;

    if (!customerName || !customerEmail || !category || !subject || !description) {
      return NextResponse.json(
        { error: "Please fill all required fields (Name, Email, Category, Subject, Description)." },
        { status: 400 }
      );
    }

    // STRICT 5-DAY RETURN & SIZE EXCHANGE POLICY VALIDATION
    if ((category === "RETURN_REFUND" || category === "SIZE_EXCHANGE") && orderNumber) {
      const { prisma } = await import("@/lib/prisma");
      const cleanNum = String(orderNumber).trim().toUpperCase();
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: cleanNum },
            { orderNumber: `PQN-${cleanNum}` },
            { id: cleanNum },
          ],
        },
      });

      if (order) {
        const returnCheck = evaluateReturnEligibility(order);
        if (!returnCheck.isEligible) {
          return NextResponse.json(
            {
              error: returnCheck.message,
              returnEligibility: returnCheck,
            },
            { status: 400 }
          );
        }
      }
    }

    const ticket = createTicket({
      customerName,
      customerEmail,
      customerPhone,
      orderNumber,
      category,
      subject,
      description,
      attachments: Array.isArray(attachments) ? attachments : [],
      priority,
    });

    return NextResponse.json({
      success: true,
      ticket,
      message: `Support ticket #${ticket.ticketNumber} created successfully. Our concierge will review your case within 2-4 hours.`,
    });
  } catch (error) {
    console.error("CUSTOMER TICKET POST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket." },
      { status: 500 }
    );
  }
}
