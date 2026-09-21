"use client";

import React, { useState } from "react";
import Link from "next/link";
import RazorpayCheckoutButton from "@/app/components/RazorpayCheckoutButton";
import { CheckIcon, CreditCardIcon, ShieldCheckIcon, LockIcon } from "@/app/components/Icons";

export default function RazorpayTestPage() {
  const [testAmount, setTestAmount] = useState<number>(100);
  const [customerName, setCustomerName] = useState<string>("Suman Test");
  const [customerEmail, setCustomerEmail] = useState<string>("test@pqnpartyqueen.com");
  const [customerPhone, setCustomerPhone] = useState<string>("9876543210");
  const [paymentLogs, setPaymentLogs] = useState<string[]>([]);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    setPaymentLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  }

  return (
    <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#072818", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCardIcon size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#072818", margin: 0 }}>
              Razorpay Standard Web Checkout Integration Test
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Test order creation, standard payment modal popup, and HMAC-SHA256 signature verification.
            </p>
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "12px" }}>
            <span><strong>Key ID:</strong> <code>{process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_Tb79L3WjS62yNA"}</code></span>
            <span style={{ color: "#166534", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
              <ShieldCheckIcon size={14} /> Razorpay Standard Checkout
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Amount (₹ INR)</label>
            <input
              type="number"
              min="1"
              value={testAmount}
              onChange={(e) => setTestAmount(Math.max(1, Number(e.target.value)))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Customer Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Customer Phone</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>
        </div>

        {paymentSuccess && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", borderRadius: "8px", marginBottom: "20px", color: "#166534" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "15px", marginBottom: "8px" }}>
              <CheckIcon size={20} /> Payment Verified & Completed Successfully!
            </div>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <div><strong>Payment ID:</strong> {paymentSuccess.razorpay_payment_id}</div>
              <div><strong>Order ID:</strong> {paymentSuccess.razorpay_order_id}</div>
              <div><strong>Signature:</strong> <code>{paymentSuccess.razorpay_signature}</code></div>
            </div>
          </div>
        )}

        {paymentError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "16px", borderRadius: "8px", marginBottom: "20px", color: "#991b1b", fontSize: "13px" }}>
            <strong>Payment Error:</strong> {paymentError}
          </div>
        )}

        <div style={{ marginTop: "16px" }}>
          <RazorpayCheckoutButton
            amountInRupees={testAmount}
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            buttonText={`PAY ₹${testAmount} TEST ORDER NOW`}
            className="btn-primary"
            notes={{
              testMode: "true",
              demoSource: "Razorpay Standard Integration Sandbox",
            }}
            onSuccess={(res) => {
              setPaymentSuccess(res);
              setPaymentError(null);
              addLog(`Payment verified! Payment ID: ${res.razorpay_payment_id}`);
            }}
            onError={(err) => {
              setPaymentError(err);
              setPaymentSuccess(null);
              addLog(`Error: ${err}`);
            }}
            onDismiss={() => {
              addLog("User dismissed Razorpay checkout modal.");
            }}
          />
        </div>

        {paymentLogs.length > 0 && (
          <div style={{ marginTop: "28px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "700", color: "#475569" }}>Execution Log Stream</h4>
            <div style={{ background: "#0f172a", color: "#38bdf8", padding: "12px", borderRadius: "6px", fontSize: "11.5px", fontFamily: "monospace", maxHeight: "160px", overflowY: "auto" }}>
              {paymentLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Link href="/checkout" style={{ fontSize: "13px", color: "#072818", textDecoration: "underline" }}>
            ← Return to Storefront Checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
