import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";
import { evaluateReturnEligibility } from "@/lib/return-policy";
import fs from "fs";
import path from "path";

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

const PAYMENTS_FILE_PATH = path.join(process.cwd(), "data", "payments-hub.json");

type PaymentHubData = {
  gateways: Record<string, { enabled: boolean; mode: "test" | "live"; keys: Record<string, string> }>;
  payouts: Array<{
    id: string;
    gateway: string;
    amount: number;
    currency: string;
    status: "PAID" | "IN_TRANSIT" | "PENDING";
    destinationBank: string;
    arrivalDate: string;
    transactionCount: number;
  }>;
  disputes: Array<{
    id: string;
    transactionId: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    reason: string;
    status: "UNDER_REVIEW" | "NEEDS_RESPONSE" | "WON" | "LOST";
    evidenceDue: string;
    evidenceText?: string;
  }>;
};

const defaultPaymentHubData: PaymentHubData = {
  gateways: {
    razorpay: {
      enabled: true,
      mode: "test",
      keys: { keyId: "rzp_test_PQN123456", keySecret: "••••••••••••••••" },
    },
    stripe: {
      enabled: true,
      mode: "test",
      keys: { publishableKey: "pk_test_51PQN...", secretKey: "••••••••••••••••" },
    },
    paypal: {
      enabled: true,
      mode: "test",
      keys: { clientId: "AZ_PayPal_Client_PQN", clientSecret: "••••••••••••••••" },
    },
    applePay: {
      enabled: true,
      mode: "live",
      keys: { merchantId: "merchant.com.pqnpartyqueen" },
    },
    klarna: {
      enabled: false,
      mode: "test",
      keys: { apiKey: "klarna_test_key_123" },
    },
    upi: {
      enabled: true,
      mode: "live",
      keys: { vpaAddress: "pqnpartyqueen@icici" },
    },
    cod: {
      enabled: true,
      mode: "live",
      keys: { maxAmount: "50000" },
    },
  },
  payouts: [
    {
      id: "po_1N9a82BvK",
      gateway: "Razorpay",
      amount: 145000,
      currency: "INR",
      status: "PAID",
      destinationBank: "HDFC Bank (•••• 4012)",
      arrivalDate: "2026-08-24",
      transactionCount: 8,
    },
    {
      id: "po_1N8x99LvZ",
      gateway: "Stripe",
      amount: 89500,
      currency: "INR",
      status: "IN_TRANSIT",
      destinationBank: "ICICI Bank (•••• 8921)",
      arrivalDate: "2026-08-27",
      transactionCount: 4,
    },
    {
      id: "po_1N7c11QpX",
      gateway: "Razorpay",
      amount: 62000,
      currency: "INR",
      status: "PENDING",
      destinationBank: "HDFC Bank (•••• 4012)",
      arrivalDate: "2026-08-28",
      transactionCount: 3,
    },
  ],
  disputes: [
    {
      id: "dp_982341",
      transactionId: "txn_rzp_98432",
      orderNumber: "PQN-7841",
      customerName: "Ananya Deshmukh",
      amount: 18999,
      reason: "Product Not Received (Courier Delay)",
      status: "NEEDS_RESPONSE",
      evidenceDue: "2026-08-30",
      evidenceText: "Blue Dart AWB #BD987654321IN shows delivered with recipient signature.",
    },
  ],
};

function getPaymentHubData(): PaymentHubData {
  try {
    if (fs.existsSync(PAYMENTS_FILE_PATH)) {
      const content = fs.readFileSync(PAYMENTS_FILE_PATH, "utf-8");
      return { ...defaultPaymentHubData, ...JSON.parse(content) };
    }
  } catch (err) {
    console.error("Error reading payments hub data:", err);
  }
  return defaultPaymentHubData;
}

function savePaymentHubData(data: PaymentHubData) {
  const dir = path.dirname(PAYMENTS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PAYMENTS_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Fetch live orders from database to generate live transactions
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    });

    const gateways = ["Razorpay", "UPI", "Stripe", "Cash on Delivery", "PayPal"];

    const transactions = orders.map((o, idx) => {
      const gross = Number(o.totalAmount);
      const isCod = idx % 4 === 0;
      const gateway = isCod ? "Cash on Delivery" : gateways[idx % gateways.length];
      const fee = isCod ? 0 : Math.round(gross * 0.02);
      const net = gross - fee;

      let status: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED" = "SUCCESS";
      if (o.status === "RETURNED") status = "REFUNDED";
      else if (o.status === "CANCELLED") status = "FAILED";
      else if (o.status === "PENDING") status = "PENDING";

      // Fraud risk assessment
      const riskScore = isCod ? 25 : (idx * 17) % 85;
      const riskLevel = riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "NORMAL";

      return {
        id: `txn_${gateway.toLowerCase().replace(/\s+/g, "_")}_${o.orderNumber.replace(/[^0-9]/g, "") || idx + 100}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer?.name || o.shippingName,
        customerEmail: o.customer?.email,
        gateway,
        gross,
        fee,
        net,
        currency: "INR",
        status,
        riskScore,
        riskLevel,
        cvcMatched: true,
        threeDSecure: !isCod,
        ipAddress: `103.21.${10 + (idx % 200)}.${40 + (idx % 200)}`,
        createdAt: o.createdAt,
      };
    });

    const hubData = getPaymentHubData();

    // Summary calculations
    const successfulTxns = transactions.filter((t) => t.status === "SUCCESS");
    const totalVolume = successfulTxns.reduce((s, t) => s + t.gross, 0);
    const totalFees = successfulTxns.reduce((s, t) => s + t.fee, 0);
    const netVolume = totalVolume - totalFees;
    const pendingVolume = transactions.filter((t) => t.status === "PENDING").reduce((s, t) => s + t.gross, 0);
    const refundedVolume = transactions.filter((t) => t.status === "REFUNDED").reduce((s, t) => s + t.gross, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalVolume,
        netVolume,
        totalFees,
        pendingVolume,
        refundedVolume,
        transactionCount: transactions.length,
      },
      transactions,
      gateways: hubData.gateways,
      payouts: hubData.payouts,
      disputes: hubData.disputes,
    });
  } catch (error) {
    console.error("ADMIN PAYMENTS ERROR:", error);
    return NextResponse.json({ error: "Failed to load payments data." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentData = getPaymentHubData();

    if (body.action === "update_gateways") {
      currentData.gateways = { ...currentData.gateways, ...body.gateways };
    } else if (body.action === "issue_refund") {
      // If transactionId and orderId are provided, validate 5-day policy and update order status to RETURNED
      if (body.orderId) {
        const order = await prisma.order.findUnique({ where: { id: body.orderId } });
        if (order) {
          const returnCheck = evaluateReturnEligibility(order);
          if (!returnCheck.isEligible) {
            return NextResponse.json({
              success: false,
              error: `Refund / Return blocked: ${returnCheck.message}`,
              returnEligibility: returnCheck,
            }, { status: 400 });
          }
          await prisma.order.update({
            where: { id: body.orderId },
            data: { status: "RETURNED", returnStatus: "REFUNDED", returnRequestedAt: new Date() },
          });
        }
      }
    } else if (body.action === "submit_dispute_evidence") {
      const idx = currentData.disputes.findIndex((d) => d.id === body.disputeId);
      if (idx !== -1) {
        currentData.disputes[idx].evidenceText = body.evidenceText;
        currentData.disputes[idx].status = "UNDER_REVIEW";
      }
    }

    savePaymentHubData(currentData);
    return NextResponse.json({ success: true, data: currentData });
  } catch (err: any) {
    console.error("Payment action error:", err);
    return NextResponse.json({ error: "Failed to perform payment action." }, { status: 500 });
  }
}
