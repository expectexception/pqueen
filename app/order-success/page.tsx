"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/context/ToastContext";
import {
  CheckIcon,
  TruckIcon,
  PackageIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  PrinterIcon,
} from "@/app/components/Icons";


function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const orderNumber = searchParams.get("order") || "PQN-DEMO";
  const total = Number(searchParams.get("total") || 0);
  const paymentParam = (searchParams.get("payment") || "COD").toUpperCase();
  const isOnlinePayment =
    paymentParam === "ONLINE" ||
    paymentParam === "RAZORPAY" ||
    paymentParam === "PAID" ||
    paymentParam === "PREPAID";

  function handleCopyOrder() {
    navigator.clipboard.writeText(orderNumber);
    showToast("Order number copied to clipboard!", { type: "success" });
  }

  function handlePrintReceipt() {
    window.print();
  }

  return (
    <main className="order-success-page">
      <div className="order-success-container">
        {/* HEADER */}
        <section className="order-success-header">
          <div className="order-success-check" style={isOnlinePayment ? { background: "#dcfce7", color: "#15803d" } : undefined}>
            <CheckIcon size={36} strokeWidth={2.5} />
          </div>

          <span className="section-eyebrow">ORDER CONFIRMATION</span>

          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 4vw, 48px)", margin: "10px 0" }}>
            Thank You For Your Order
          </h1>

          <p className="order-success-subtitle">
            {isOnlinePayment
              ? "Your payment was successfully processed. We are preparing your bespoke ensemble with the utmost artisanal care."
              : "Your couture order has been successfully placed. We are preparing your ensemble with the utmost artisanal care."}
          </p>

          <div className="order-number-box">
            <span>OFFICIAL ORDER REFERENCE</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <strong style={{ fontSize: "17px", letterSpacing: "1.5px" }}>{orderNumber}</strong>
              <button
                type="button"
                onClick={handleCopyOrder}
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--brand-rose)",
                  textDecoration: "underline",
                }}
              >
                COPY
              </button>
            </div>
          </div>
        </section>

        {/* 2 CARDS GRID */}
        <section className="order-success-grid">
          {/* Card 1: Details */}
          <div className="success-card">
            <div className="success-card-header">
              <div>
                <p className="success-card-label">PAYMENT & SUMMARY</p>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px" }}>Order Information</h2>
              </div>
              <span
                className="success-status"
                style={
                  isOnlinePayment
                    ? { background: "#dcfce7", color: "#15803d", fontWeight: "700" }
                    : { background: "var(--brand-rose-light)", color: "var(--brand-rose)", fontWeight: "600" }
                }
              >
                {isOnlinePayment ? "PAID & CONFIRMED" : "CONFIRMED"}
              </span>
            </div>

            <div className="success-detail-list">
              <div className="success-detail-row">
                <span>Order Reference</span>
                <strong>{orderNumber}</strong>
              </div>

              <div className="success-detail-row">
                <span>Payment Mode</span>
                <strong style={isOnlinePayment ? { color: "#15803d" } : undefined}>
                  {isOnlinePayment ? "Prepaid Online (Razorpay ✓)" : "Cash on Delivery (COD)"}
                </strong>
              </div>

              <div className="success-detail-row">
                <span>Payment Status</span>
                <strong style={{ color: isOnlinePayment ? "#15803d" : "#b45309" }}>
                  {isOnlinePayment ? "PAID IN FULL" : "PAYABLE AT DELIVERY"}
                </strong>
              </div>

              <div className="success-detail-row">
                <span>Delivery Type</span>
                <strong>Complimentary Express</strong>
              </div>

              <div className="success-detail-row">
                <span>Estimated Arrival</span>
                <strong>3 - 5 Business Days</strong>
              </div>
            </div>

            <div className="success-total" style={{ borderTop: "1.5px solid var(--border-subtle)", paddingTop: "14px" }}>
              <div>
                <span style={{ fontSize: "13px", display: "block" }}>
                  {isOnlinePayment ? "Total Amount Paid" : "Total Payable upon Delivery"}
                </span>
                {isOnlinePayment && (
                  <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "600" }}>
                    Balance Due on Delivery: ₹0
                  </span>
                )}
              </div>
              <strong style={{ color: isOnlinePayment ? "#15803d" : "var(--brand-rose)", fontSize: "20px" }}>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {/* Card 2: Timeline */}
          <div className="success-card">
            <p className="success-card-label">JOURNEY TRACKING</p>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", marginBottom: "20px" }}>
              What Happens Next
            </h2>

            <div className="order-timeline">
              <div className="timeline-item active">
                <div className="timeline-dot">
                  <CheckIcon size={14} />
                </div>
                <div>
                  <strong>1. Order & Payment Confirmed</strong>
                  <p>{isOnlinePayment ? "Payment verified via Razorpay gateway." : "Your order details have reached our atelier."}</p>
                </div>
              </div>

              <div className="timeline-item active">
                <div className="timeline-dot">
                  <PackageIcon size={14} />
                </div>
                <div>
                  <strong>2. Quality Inspection & Packaging</strong>
                  <p>Each stitch, seam, and embellishment is hand-checked.</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot">
                  <TruckIcon size={14} />
                </div>
                <div>
                  <strong>3. Express Courier Dispatch</strong>
                  <p>You will receive an SMS and WhatsApp tracking link.</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot">
                  <ShieldCheckIcon size={14} />
                </div>
                <div>
                  <strong>4. {isOnlinePayment ? "Express Doorstep Delivery" : "Doorstep Handover"}</strong>
                  <p>
                    {isOnlinePayment
                      ? "Contactless luxury delivery with tamper-proof packaging. No payment required."
                      : "Inspect your ensemble and pay cash/UPI at delivery."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENT STATUS NOTICE BOX */}
        {isOnlinePayment ? (
          <section
            className="success-cod"
            style={{
              background: "#f0fdf4",
              border: "1.5px solid #86efac",
              color: "#166534",
            }}
          >
            <div className="cod-icon" style={{ background: "#dcfce7", color: "#15803d", fontWeight: "900" }}>
              ✓
            </div>
            <div>
              <h3 style={{ color: "#15803d" }}>Payment Verified Online (Prepaid)</h3>
              <p style={{ color: "#166534" }}>
                Your online transaction of <strong>₹{total.toLocaleString("en-IN")}</strong> via Razorpay was successful. Your order is marked as fully paid, and no amount will be collected at delivery.
              </p>
            </div>
          </section>
        ) : (
          <section className="success-cod">
            <div className="cod-icon">₹</div>
            <div>
              <h3>Cash on Delivery Reminder</h3>
              <p>
                Please keep ₹{total.toLocaleString("en-IN")} ready in cash or UPI scan at the time of delivery. Our courier executive will provide an official digital receipt.
              </p>
            </div>
          </section>
        )}

        {/* ACTIONS */}
        <section className="success-actions">
          <Link href="/shop" className="btn-primary" style={{ padding: "16px 36px" }}>
            CONTINUE SHOPPING <ArrowRightIcon size={16} />
          </Link>

          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrintReceipt}
            style={{ padding: "16px 32px" }}
          >
            PRINT RECEIPT <PrinterIcon size={16} />
          </button>
        </section>

        <p className="success-footer">
          Questions regarding your order? Reach our VIP concierge support at <strong>support@pqnpartyqueen.com</strong>
        </p>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="order-success-page">
          <div className="order-success-container">
            <h2 style={{ textAlign: "center" }}>Loading your order confirmation...</h2>
          </div>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}