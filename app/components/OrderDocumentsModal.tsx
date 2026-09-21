"use client";

import React, { useState } from "react";
import {
  CloseIcon,
  CheckIcon,
  PackageIcon,
  TruckIcon,
  ShieldCheckIcon,
  ZapIcon,
  RefreshCwIcon,
  PrinterIcon,
  TagIcon,
} from "@/app/components/Icons";
import { getGSTStateInfo, numberToIndianWords, generateAutomatedAWB } from "@/lib/indian-logistics";
import { evaluateReturnEligibility } from "@/lib/return-policy";

type OrderItem = {
  id: string;
  productId?: string | null;
  productName: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  price: string | number;
};

type Customer = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string | number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  awbNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  shippingLabelUrl?: string | null;
  shippingStatus?: string | null;
  ithinkOrderId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};

type OrderDocumentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  mode: "invoice" | "packingslip" | "shippinglabel" | "combined" | "refund" | "dispatch";
  onStatusUpdate?: (newStatus: string) => Promise<void>;
  isCustomerView?: boolean;
};

export default function OrderDocumentsModal({
  isOpen,
  onClose,
  order,
  mode: initialMode,
  onStatusUpdate,
  isCustomerView = false,
}: OrderDocumentsModalProps) {
  const [activeTab, setActiveTab] = useState<"invoice" | "packingslip" | "shippinglabel" | "combined" | "dispatch" | "refund">(
    isCustomerView ? "invoice" : (initialMode as any)
  );
  
  // Live iThink Logistics & Courier AWB State
  const [selectedCourier, setSelectedCourier] = useState(order.courierName || "Delhivery Surface & Express (iThink)");
  const [packageWeight, setPackageWeight] = useState("0.80");
  const [awbInfo, setAwbInfo] = useState<{ awb: string; carrier: string; trackingUrl: string; hubCode: string; estimatedDays: string; isLive?: boolean } | null>(() => {
    if (order.awbNumber) {
      return {
        awb: order.awbNumber,
        carrier: order.courierName || "iThink Logistics (Delhivery / Blue Dart)",
        trackingUrl: order.trackingUrl || `https://my.ithinklogistics.com/track?awb=${order.awbNumber}`,
        hubCode: "DEL-NDLS01",
        estimatedDays: "1 - 3 Days",
        isLive: true
      };
    }
    return null;
  });
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Refund State
  const [refundReason, setRefundReason] = useState("Customer requested cancellation / size exchange");
  const [refundAmount, setRefundAmount] = useState(String(order.totalAmount));
  const [restockItem, setRestockItem] = useState(true);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);

  // Owner Signature & Legal Entity Settings
  const [signatureInfo, setSignatureInfo] = useState<{
    signatureUrl: string | null;
    signatoryName: string;
    signatoryTitle: string;
    companyName: string;
  }>({
    signatureUrl: "/images/authorized-signature.svg",
    signatoryName: "Karan Oberoi",
    signatoryTitle: "Authorized Signatory",
    companyName: "PQN PARTY QUEEN",
  });

  React.useEffect(() => {
    async function loadSignatureSettings() {
      try {
        const res = await fetch("/api/settings/public", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSignatureInfo({
            signatureUrl: data.invoiceOwnerSignatureUrl || "/images/authorized-signature.svg",
            signatoryName: data.invoiceSignatoryName || "Karan Oberoi",
            signatoryTitle: data.invoiceSignatoryTitle || "Authorized Signatory",
            companyName: data.invoiceCompanyName || "PQN PARTY QUEEN",
          });
        }
      } catch {
        // Fallback gracefully without throwing
      }
    }
    loadSignatureSettings();
  }, []);

  if (!isOpen) return null;

  const totalNum = Number(order.totalAmount) || 0;
  const taxableAmount = (totalNum / 1.12).toFixed(2);
  const gstAmount = (totalNum - Number(taxableAmount)).toFixed(2);

  // Determine Destination State Info & GST applicability (Delhi Seller = State Code 07)
  const stateInfo = getGSTStateInfo(order.shippingState || "Delhi");
  const isIntraState = stateInfo.code === "07" || stateInfo.name.toLowerCase().includes("delhi");

  const cgstAmount = isIntraState ? (Number(gstAmount) / 2).toFixed(2) : "0.00";
  const sgstAmount = isIntraState ? (Number(gstAmount) / 2).toFixed(2) : "0.00";
  const igstAmount = !isIntraState ? gstAmount : "0.00";

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handlePrint() {
    window.print();
  }

  async function handleConfirmCourierDispatch() {
    try {
      setDispatching(true);
      const res = await fetch("/api/admin/shipping/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          providerId: "ithink",
          courierName: selectedCourier,
          weightKg: parseFloat(packageWeight) || 0.8
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to dispatch via iThink Logistics.");
      }

      const returnedAwb = data.shipment?.awbNumber || `ITL${Date.now()}`;
      const returnedCourier = data.shipment?.courierName || selectedCourier;
      const returnedTrack = data.shipment?.trackingUrl || `https://my.ithinklogistics.com/track?awb=${returnedAwb}`;
      const returnedLabel = data.shipment?.labelUrl || `https://my.ithinklogistics.com/print_label?awb=${returnedAwb}`;

      setAwbInfo({
        awb: returnedAwb,
        carrier: returnedCourier,
        trackingUrl: returnedTrack,
        hubCode: "DEL-NDLS01",
        estimatedDays: "1 - 3 Days",
        isLive: true
      });

      if (onStatusUpdate) {
        await onStatusUpdate("SHIPPED");
      }

      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchSuccess(false);
        setActiveTab("shippinglabel");
      }, 800);
    } catch (err: any) {
      console.error("Dispatch Error:", err);
      alert(err.message || "Failed to schedule courier dispatch with iThink Logistics.");
    } finally {
      setDispatching(false);
    }
  }

  async function handleExecuteRefund(e: React.FormEvent) {
    e.preventDefault();
    const returnCheck = evaluateReturnEligibility(order);
    if (!returnCheck.isEligible) {
      alert(`Return / Refund Blocked: ${returnCheck.message}`);
      return;
    }

    setProcessingRefund(true);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate("RETURNED");
      } else {
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, status: "RETURNED" }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to update order status to RETURNED");
        }
      }
      setRefundSuccess(true);
      setTimeout(() => {
        setRefundSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to process refund. Please try again.");
    } finally {
      setProcessingRefund(false);
    }
  }

  const isCod = (order.paymentMethod || "").toUpperCase() === "COD";

  // RENDERER: GST TAX INVOICE
  const renderInvoice = () => (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#1c1917" }}>
      {/* INVOICE TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5px solid #0d4428", paddingBottom: "18px", marginBottom: "20px" }}>
        <div>
          <img src="/logo-gold.png?v=3" alt="PQN PARTY QUEEN" style={{ height: "46px", objectFit: "contain", marginBottom: "6px" }} />
          <div style={{ fontSize: "11.5px", color: "#374151", lineHeight: "1.45" }}>
            <strong style={{ fontSize: "12.5px", color: "#0d4428" }}>PQN PARTY QUEEN ATELIER PVT. LTD.</strong><br />
            108, Haute Couture Enclave, Fashion Boulevard, Connaught Place<br />
            New Delhi - 110001, Delhi, India<br />
            <strong>GSTIN:</strong> 07AAACP9876Q1Z2 &bull; <strong>State Code:</strong> 07 (Delhi)<br />
            <strong>Email:</strong> billing@pqnpartyqueen.com &bull; <strong>WhatsApp:</strong> +91 98765 43210
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "22px", fontWeight: "900", color: "#0d4428", letterSpacing: "1.5px", textTransform: "uppercase", display: "block" }}>
            TAX INVOICE
          </span>
          <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#c59b27", letterSpacing: "1px", textTransform: "uppercase" }}>
            ORIGINAL FOR RECIPIENT
          </span>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#1f2937", lineHeight: "1.4" }}>
            <strong>Invoice No:</strong> INV/2026-27/{order.orderNumber.replace(/[^0-9]/g, "") || "0082"}<br />
            <strong>Order ID:</strong> #{order.orderNumber}<br />
            <strong>Date & Time:</strong> {formattedDate}, {formattedTime}<br />
            <strong>Payment Mode:</strong> <span style={{ fontWeight: "800", color: isCod ? "#c2410c" : "#15803d" }}>{isCod ? "Cash on Delivery (COD)" : "Prepaid (Online / Razorpay)"}</span><br />
            <strong>Payment Status:</strong> <span style={{ fontWeight: "800", color: isCod ? "#c2410c" : "#15803d" }}>{isCod ? "PENDING (Collect at Delivery)" : "PAID (₹0.00 Due)"}</span><br />
            {order.razorpayPaymentId && (
              <><strong>Payment Ref:</strong> <span style={{ fontFamily: "monospace", fontSize: "11px" }}>{order.razorpayPaymentId}</span><br /></>
            )}
            <strong>Place of Supply:</strong> {stateInfo.name} ({stateInfo.code})<br />
            <strong>Reverse Charge:</strong> No (Regular B2C Tax Invoice)
          </div>
        </div>
      </div>

      {/* BILLED TO vs DELIVERED TO (SHIPPING ADDRESS) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "16px 20px", background: "#f6f9f7", borderRadius: "6px", marginBottom: "22px", border: "1.5px solid #d4e2d8" }}>
        {/* 1. BILLED TO */}
        <div>
          <span style={{ fontSize: "11px", fontWeight: "900", color: "#0d4428", letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            BILLED TO (BUYER DETAILS):
          </span>
          <strong style={{ fontSize: "14px", color: "#111827" }}>
            {order.customer?.name || order.shippingName}
          </strong>
          <div style={{ fontSize: "12px", color: "#374151", marginTop: "4px", lineHeight: "1.45" }}>
            Email: {order.customer?.email}<br />
            Mobile: +91 {order.shippingPhone || order.customer?.phone || "N/A"}<br />
            State: {stateInfo.name} &bull; <strong>State Code:</strong> {stateInfo.code}<br />
            Buyer Type: <strong>Unregistered Consumer (B2C)</strong>
          </div>
        </div>

        {/* 2. DELIVERED TO / SHIPPED TO */}
        <div style={{ borderLeft: "1.5px dashed #b8d0be", paddingLeft: "20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "900", color: "#0d4428", letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            DELIVERED TO (CONSIGNEE SHIPPING ADDRESS):
          </span>
          <strong style={{ fontSize: "14px", color: "#111827" }}>
            {order.shippingName}
          </strong>
          <div style={{ fontSize: "12px", color: "#374151", marginTop: "4px", lineHeight: "1.45" }}>
            {order.shippingAddress}<br />
            <strong style={{ color: "#0d4428" }}>{order.shippingCity}, {order.shippingState} - {order.shippingPincode}</strong><br />
            Destination State Code: <strong>{stateInfo.code} ({stateInfo.name})</strong><br />
            Contact: <strong>+91 {order.shippingPhone}</strong>
          </div>
        </div>
      </div>

      {/* ITEMIZED GST APPAREL TABLE */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px", fontSize: "12px" }}>
        <thead>
          <tr style={{ background: "#0d4428", color: "#ffffff", textAlign: "left" }}>
            <th style={{ padding: "9px 10px", width: "35px" }}>#</th>
            <th style={{ padding: "9px 10px" }}>Item & Haute Couture Silhouette</th>
            <th style={{ padding: "9px 10px", width: "75px" }}>HSN/SAC</th>
            <th style={{ padding: "9px 10px", width: "70px" }}>Size</th>
            <th style={{ padding: "9px 10px", width: "45px", textAlign: "center" }}>Qty</th>
            <th style={{ padding: "9px 10px", width: "95px", textAlign: "right" }}>Rate (₹)</th>
            <th style={{ padding: "9px 10px", width: "95px", textAlign: "right" }}>Taxable (₹)</th>
            <th style={{ padding: "9px 10px", width: "95px", textAlign: "right" }}>GST (12%)</th>
            <th style={{ padding: "9px 10px", width: "105px", textAlign: "right" }}>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => {
            const itemPrice = Number(item.price);
            const itemTotal = itemPrice * item.quantity;
            const itemTaxable = (itemTotal / 1.12).toFixed(2);
            const itemGst = (itemTotal - Number(itemTaxable)).toFixed(2);

            return (
              <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "10px", color: "#6b7280" }}>{idx + 1}</td>
                <td style={{ padding: "10px" }}>
                  <strong style={{ color: "#111827", fontSize: "12.5px" }}>{item.productName}</strong>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    Artisanal Handcrafted Haute Couture {item.color ? `• Color: ${item.color}` : ""}
                  </div>
                </td>
                <td style={{ padding: "10px", color: "#4b5563", fontFamily: "monospace" }}>6204</td>
                <td style={{ padding: "10px", fontWeight: "700" }}>{item.size || "Standard"}</td>
                <td style={{ padding: "10px", textAlign: "center", fontWeight: "700" }}>{item.quantity}</td>
                <td style={{ padding: "10px", textAlign: "right" }}>₹{itemPrice.toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(itemTaxable).toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px", textAlign: "right", color: "#4a6350" }}>₹{Number(itemGst).toLocaleString("en-IN")}</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: "800", color: "#0d4428" }}>₹{itemTotal.toLocaleString("en-IN")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TOTALS & TAX BREAKDOWN */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginTop: "16px", borderTop: "1.5px solid #d4e2d8", paddingTop: "16px" }}>
        {/* LEFT: AMOUNT IN WORDS & TERMS */}
        <div style={{ fontSize: "11.5px", color: "#374151", lineHeight: "1.5" }}>
          {/* PAYMENT MODE SUMMARY BADGE */}
          {isCod ? (
            <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", padding: "10px 14px", borderRadius: "6px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "10.5px", fontWeight: "900", color: "#c2410c", letterSpacing: "1px", textTransform: "uppercase", display: "block" }}>
                    PAYMENT MODE: CASH ON DELIVERY (COD)
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#9a3412" }}>
                    Collect exact cash or UPI payment at doorstep upon delivery
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "10px", color: "#9a3412", textTransform: "uppercase", display: "block" }}>Amount to Collect:</span>
                  <strong style={{ fontSize: "15px", color: "#c2410c" }}>₹{totalNum.toLocaleString("en-IN")}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", padding: "10px 14px", borderRadius: "6px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "10.5px", fontWeight: "900", color: "#15803d", letterSpacing: "1px", textTransform: "uppercase", display: "block" }}>
                    PAYMENT MODE: PREPAID (PAID ONLINE)
                  </span>
                  <span style={{ fontSize: "11.5px", color: "#166534" }}>
                    Paid in full via Razorpay / Online Gateway • No collection needed
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "10px", color: "#166534", textTransform: "uppercase", display: "block" }}>Doorstep Due:</span>
                  <strong style={{ fontSize: "15px", color: "#15803d" }}>₹0.00 (PAID)</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: "#fcf8ee", padding: "10px 14px", borderRadius: "6px", border: "1px solid #ebd9a4", marginBottom: "14px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#967417", textTransform: "uppercase", display: "block" }}>
              Invoice Value In Words:
            </span>
            <strong style={{ fontSize: "12.5px", color: "#072818" }}>
              {numberToIndianWords(totalNum)}
            </strong>
          </div>

          <strong>Terms & Conditions:</strong><br />
          1. 100% Authentic Handcrafted Haute Couture with complimentary 7-day doorstep exchange guarantee.<br />
          2. All disputes are subject to New Delhi jurisdiction only.<br />
          3. This computer generated tax invoice is fully compliant under Section 31 of CGST Act 2017.<br />
        </div>

        {/* RIGHT: TAX BREAKDOWN BOX */}
        <div style={{ background: "#fafaf9", padding: "16px 20px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span>Gross Taxable Value:</span>
            <strong>₹{Number(taxableAmount).toLocaleString("en-IN")}</strong>
          </div>

          {isIntraState ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#4b5563" }}>
                <span>CGST (6% Intra-State Delhi):</span>
                <span>₹{Number(cgstAmount).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#4b5563" }}>
                <span>SGST (6% Intra-State Delhi):</span>
                <span>₹{Number(sgstAmount).toLocaleString("en-IN")}</span>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#4b5563" }}>
              <span>IGST (12% Inter-State to {stateInfo.name}):</span>
              <span>₹{Number(igstAmount).toLocaleString("en-IN")}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#15803d" }}>
            <span>Express Insured Air Dispatch:</span>
            <span>FREE (₹0.00)</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", borderTop: "2px solid #0d4428", marginTop: "8px", fontSize: "16px", fontWeight: "900", color: "#0d4428" }}>
            <span>Total Amount (INR):</span>
            <span>₹{totalNum.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* AUTHORIZED SIGNATORY SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px", paddingTop: "14px", borderTop: "1.5px solid #d4e2d8" }}>
        <div style={{ fontSize: "11px", color: "#4b5563", lineHeight: "1.5", maxWidth: "460px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "4px", color: "#166534", fontWeight: "700", marginBottom: "4px" }}>
            ✓ DIGITALLY VERIFIED TAX INVOICE
          </div>
          <div>This is a computer-authenticated invoice generated under the authority of PQN PARTY QUEEN ATELIER PVT. LTD.</div>
        </div>

        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: "11px", fontWeight: "900", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "2px" }}>
            Authorized Signature
          </span>

          {signatureInfo.signatureUrl ? (
            <div style={{ height: "54px", minWidth: "150px", display: "flex", alignItems: "center", justifyContent: "flex-end", margin: "4px 0" }}>
              <img
                src={signatureInfo.signatureUrl}
                alt="Owner Signature"
                style={{
                  maxHeight: "50px",
                  maxWidth: "180px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <div style={{ height: "34px", width: "150px", borderBottom: "1.5px solid #374151", margin: "4px 0 6px" }} />
          )}

          <strong style={{ fontSize: "12px", color: "#111827", display: "block" }}>
            For {signatureInfo.companyName || "PQN PARTY QUEEN"}
          </strong>
          <span style={{ fontSize: "10.5px", color: "#4b5563" }}>
            {signatureInfo.signatoryName || "Karan Oberoi"} &bull; {signatureInfo.signatoryTitle || "Authorized Signatory"}
          </span>
        </div>
      </div>
    </div>
  );

  // RENDERER: WAREHOUSE PACKING SLIP
  const renderPackingSlip = () => (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#1c1917" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1c1917", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
            WAREHOUSE PACKING SLIP & QC AUDIT
          </h1>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Order Ref: #{order.orderNumber}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "13px", fontWeight: "700" }}>Date: {formattedDate}</span>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Priority: Haute Couture Express</div>
        </div>
      </div>

      {/* RECIPIENT & SHIPPER */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", padding: "14px", border: "1px dashed #9ca3af", borderRadius: "4px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", color: "#6b7280" }}>DELIVERY RECIPIENT:</span>
          <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "2px" }}>{order.shippingName}</div>
          <div style={{ fontSize: "12px", color: "#374151" }}>
            {order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}<br />
            Phone: +91 {order.shippingPhone}
          </div>
        </div>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", color: "#6b7280" }}>FULFILLMENT ATELIER:</span>
          <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "2px" }}>PQN Central Fashion Hub</div>
          <div style={{ fontSize: "12px", color: "#374151" }}>
            Warehouse Bay 4, Connaught Place, New Delhi 110001
          </div>
        </div>
      </div>

      {/* PICKLIST TABLE WITH CHECKBOXES */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "12px" }}>
        <thead>
          <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #374151", textAlign: "left" }}>
            <th style={{ padding: "8px", width: "40px", textAlign: "center" }}>Check</th>
            <th style={{ padding: "8px" }}>Item Description</th>
            <th style={{ padding: "8px", width: "100px" }}>SKU Code</th>
            <th style={{ padding: "8px", width: "80px" }}>Size</th>
            <th style={{ padding: "8px", width: "60px", textAlign: "center" }}>Qty</th>
            <th style={{ padding: "8px", width: "100px" }}>QC Status</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "10px", textAlign: "center" }}>
                <div style={{ width: "18px", height: "18px", border: "2px solid #374151", borderRadius: "3px", margin: "0 auto" }} />
              </td>
              <td style={{ padding: "10px" }}>
                <strong style={{ fontSize: "13px" }}>{item.productName}</strong>
              </td>
              <td style={{ padding: "10px", fontFamily: "monospace", fontSize: "11px" }}>
                PQN-{item.size || "STD"}-{idx + 101}
              </td>
              <td style={{ padding: "10px", fontWeight: "700" }}>{item.size || "Free Size"}</td>
              <td style={{ padding: "10px", textAlign: "center", fontWeight: "800", fontSize: "14px" }}>{item.quantity}</td>
              <td style={{ padding: "10px", color: "#15803d", fontWeight: "700" }}>[  ] PASSED</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SIGN OFF */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
        <div>
          <div style={{ borderBottom: "1px solid #9ca3af", height: "30px", marginBottom: "4px" }} />
          <span style={{ fontSize: "11px", color: "#6b7280" }}>Picker Signature & Date</span>
        </div>
        <div>
          <div style={{ borderBottom: "1px solid #9ca3af", height: "30px", marginBottom: "4px" }} />
          <span style={{ fontSize: "11px", color: "#6b7280" }}>QC Inspector Signature</span>
        </div>
      </div>
    </div>
  );

  // RENDERER: COURIER SHIPPING LABEL
  const renderShippingLabel = () => {
    const awbCode = awbInfo?.awb || order.awbNumber || `ITL${order.orderNumber.replace(/[^0-9]/g, "").slice(-8)}`;
    // Generate barcode pattern from AWB characters
    const barcodeBars = Array.from(awbCode).flatMap((ch, idx) => {
      const code = ch.charCodeAt(0);
      return [(code % 3) + 1, ((code >> 1) % 2) + 1, ((code >> 2) % 4) + 1];
    });

    return (
      <div style={{ maxWidth: "540px", margin: "0 auto", border: "2.5px solid #000000", padding: "20px", borderRadius: "6px", fontFamily: "'Helvetica Neue', Arial, sans-serif", color: "#000000", background: "#ffffff" }}>
        {/* TOP CARRIER STRIP */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: "800", color: "#0d4428", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              iThink Logistics Live Partner
            </div>
            <span style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.5px" }}>
              {awbInfo?.carrier || order.courierName || selectedCourier}
            </span>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#4b5563" }}>
              AIR SECURE PRIORITY COUTURE DELIVERY
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "13px", fontWeight: "900", background: isCod ? "#c2410c" : "#0d4428", color: "#fff", padding: "4px 10px", borderRadius: "3px", letterSpacing: "1px" }}>
              {isCod ? "CASH ON DELIVERY (COD)" : "PREPAID (PAID ONLINE)"}
            </span>
            <div style={{ fontSize: "12px", fontWeight: "800", marginTop: "4px", color: isCod ? "#c2410c" : "#0d4428" }}>
              {isCod ? `Collect: ₹${totalNum.toLocaleString("en-IN")}` : "Collect: ₹0.00 (Prepaid)"}
            </div>
          </div>
        </div>

        {/* SCANNABLE BARCODE PREVIEW */}
        <div style={{ textAlign: "center", padding: "12px 0", borderBottom: "2px solid #000000", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", height: "52px", gap: "2px", background: "#fff", padding: "4px" }}>
            {barcodeBars.slice(0, 32).map((w, i) => (
              <div key={i} style={{ width: `${w * 1.6}px`, background: i % 2 === 0 ? "#000" : "transparent" }} />
            ))}
          </div>
          <span style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: "900", letterSpacing: "3px", display: "block", marginTop: "6px" }}>
            AWB: {awbCode}
          </span>
          <span style={{ fontSize: "11px", color: "#374151", fontWeight: "600" }}>
            Destination Hub: <strong>{awbInfo?.hubCode || "DEL-NDLS01"}</strong> &bull; Order #{order.orderNumber}
          </span>
        </div>

        {/* DELIVER TO / CONSIGNEE DESTINATION */}
        <div style={{ borderBottom: "2px solid #000000", paddingBottom: "14px", marginBottom: "14px" }}>
          <span style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" }}>
            DELIVER TO / CONSIGNEE:
          </span>
          <div style={{ fontSize: "17px", fontWeight: "900", marginTop: "2px" }}>{order.shippingName}</div>
          <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "4px", lineHeight: "1.4" }}>
            {order.shippingAddress}<br />
            <strong style={{ fontSize: "15px" }}>{order.shippingCity}, {order.shippingState} - {order.shippingPincode}</strong><br />
            PHONE: <strong style={{ fontSize: "14px" }}>+91 {order.shippingPhone}</strong>
          </div>
        </div>

        {/* RETURN SENDER & MANIFEST DETAILS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", fontSize: "11px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px", marginBottom: "12px" }}>
          <div>
            <span style={{ fontWeight: "800" }}>IF UNDELIVERED, RETURN TO:</span><br />
            PQN PARTY QUEEN ATELIER LOGISTICS<br />
            WZ 147 A D Block 2 Uttam Nagar, New Delhi 110059<br />
            Warehouse Ref ID: 123718 &bull; Helpline: +91 9958907429
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>Gross Weight:</strong> {packageWeight} KG<br />
            <strong>Items Count:</strong> {order.items.reduce((s, it) => s + it.quantity, 0)} Nos<br />
            <strong>Date:</strong> {formattedDate}<br />
            <strong>Routing SLA:</strong> 1-3 Business Days
          </div>
        </div>

        {/* EXTERNAL ITHINK ACTION STRIP (NO-PRINT) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", paddingTop: "6px" }}>
          <a
            href={awbInfo?.trackingUrl || order.trackingUrl || `https://my.ithinklogistics.com/track?awb=${awbCode}`}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "11.5px",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <TruckIcon size={13} /> Live Carrier Tracking ↗
          </a>

          {order.shippingLabelUrl && (
            <a
              href={order.shippingLabelUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                background: "#0d4428",
                border: "1px solid #0d4428",
                color: "#f5d77f",
                fontSize: "11.5px",
                fontWeight: "800",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              📥 Official Carrier PDF ↗
            </a>
          )}
        </div>
      </div>
    );
  };


  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(7, 40, 24, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "940px",
          maxHeight: "94vh",
          background: "#ffffff",
          borderRadius: "10px",
          border: "1.5px solid #c59b27",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* MODAL CONTROLS & TAB STRIP (HIDDEN IN PRINT) */}
        <div
          className="no-print"
          style={{
            background: "#072818",
            borderBottom: "1.5px solid #c59b27",
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {/* TABS / HEADER BRANDING */}
          {isCustomerView ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src="/logo-gold.png?v=3" alt="PQN PARTY QUEEN" style={{ height: "26px", objectFit: "contain" }} />
              <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#f5d77f", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Official GST Tax Invoice &bull; #{order.orderNumber}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[
                { id: "combined", label: "All-In-One (Invoice + Packing Slip + Label)" },
                { id: "invoice", label: "GST Invoice" },
                { id: "shippinglabel", label: "Courier Label" },
                { id: "packingslip", label: "Packing Slip" },
                { id: "dispatch", label: "AWB Dispatch" },
                { id: "refund", label: "Return & Refund" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    border: "none",
                    background: activeTab === tab.id ? "#c59b27" : "rgba(255,255,255,0.12)",
                    color: activeTab === tab.id ? "#072818" : "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ACTIONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {activeTab !== "refund" && activeTab !== "dispatch" && (
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  padding: "6px 16px",
                  borderRadius: "4px",
                  background: "#15803d",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <PrinterIcon size={14} /> Download / Print PDF
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#f5d77f",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* MODAL SCROLLABLE CONTENT BODY */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px",
            background: activeTab === "refund" || activeTab === "dispatch" ? "#fafaf9" : "#ffffff",
          }}
        >
          {/* TAB 0: COMBINED ALL-IN-ONE DOSSIER (INVOICE + PACKING SLIP + SHIPPING LABEL) */}
          {activeTab === "combined" && (
            <div id="printable-combined">
              {/* PAGE 1: GST TAX INVOICE */}
              <div id="combined-invoice-section" style={{ pageBreakAfter: "always", breakAfter: "page", paddingBottom: "36px" }}>
                <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0d4428", background: "#f0f7f3", padding: "4px 10px", borderRadius: "12px", border: "1px solid #c59b27" }}>
                    DOCUMENT 1 OF 3: GST TAX INVOICE (ORIGINAL FOR RECIPIENT)
                  </span>
                </div>
                {renderInvoice()}
              </div>

              {/* PAGE 2: WAREHOUSE PACKING SLIP */}
              <div id="combined-packingslip-section" style={{ pageBreakAfter: "always", breakAfter: "page", paddingTop: "36px", paddingBottom: "36px", borderTop: "2px dashed #c59b27" }}>
                <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0d4428", background: "#f0f7f3", padding: "4px 10px", borderRadius: "12px", border: "1px solid #c59b27" }}>
                    DOCUMENT 2 OF 3: WAREHOUSE PACKING SLIP & QC CHECKLIST
                  </span>
                </div>
                {renderPackingSlip()}
              </div>

              {/* PAGE 3: COURIER SHIPPING LABEL */}
              <div id="combined-label-section" style={{ paddingTop: "36px", borderTop: "2px dashed #c59b27" }}>
                <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                  <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0d4428", background: "#f0f7f3", padding: "4px 10px", borderRadius: "12px", border: "1px solid #c59b27" }}>
                    DOCUMENT 3 OF 3: COURIER HANDOVER & SHIPPING LABEL
                  </span>
                </div>
                {renderShippingLabel()}
              </div>
            </div>
          )}

          {/* TAB 1: INDIVIDUAL GST TAX INVOICE */}
          {activeTab === "invoice" && (
            <div id="printable-invoice">
              {renderInvoice()}
            </div>
          )}

          {/* TAB 2: INDIVIDUAL COURIER SHIPPING LABEL */}
          {activeTab === "shippinglabel" && (
            <div id="printable-shippinglabel">
              {renderShippingLabel()}
            </div>
          )}

          {/* TAB 3: INDIVIDUAL WAREHOUSE PACKING SLIP */}
          {activeTab === "packingslip" && (
            <div id="printable-packingslip">
              {renderPackingSlip()}
            </div>
          )}

          {/* TAB 4: AUTOMATED COURIER DISPATCH HUB */}
          {activeTab === "dispatch" && (
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div style={{ background: "#ffffff", padding: "28px", borderRadius: "8px", border: "1px solid #c59b27", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0d4428", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <ZapIcon size={18} /> Automated Courier Dispatch & AWB Generator
                    </h2>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Instant Waybill generation as per Indian eCommerce logistics standards
                    </span>
                  </div>
                    <span style={{ fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "12px", background: order.awbNumber ? "#f0fdf4" : "#fef3c7", color: order.awbNumber ? "#15803d" : "#92400e", border: order.awbNumber ? "1px solid #bbf7d0" : "1px solid #fde68a" }}>
                    STATUS: {order.awbNumber ? "DISPATCHED / MANIFESTED" : order.status}
                  </span>
                </div>

                {dispatchSuccess ? (
                  <div style={{ padding: "24px", textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" }}>
                    <CheckIcon size={36} className="text-green-600" />
                    <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#166534", marginTop: "10px" }}>
                      Courier Dispatch Scheduled & Live AWB Generated!
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "#15803d", margin: "4px 0 16px" }}>
                      AWB <strong>{awbInfo?.awb || order.awbNumber}</strong> assigned to {awbInfo?.carrier || order.courierName}. Order status updated to SHIPPED / MANIFESTED.
                    </p>
                  </div>
                ) : (order.awbNumber || awbInfo?.isLive) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ background: "#f0fdf4", borderRadius: "8px", border: "1.5px solid #86efac", padding: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <ShieldCheckIcon size={18} className="text-green-700" />
                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Verified Active Shipment &bull; iThink Logistics Manifested
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", background: "#ffffff", padding: "16px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Official Waybill (AWB)</span>
                          <div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "900", color: "#0d4428", letterSpacing: "1.5px", marginTop: "2px" }}>
                            {order.awbNumber || awbInfo?.awb}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Assigned Courier Carrier</span>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                            {order.courierName || awbInfo?.carrier || "Delhivery Surface & Express"}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Fulfillment Status</span>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>
                            Manifested & Dispatched
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
                        <a
                          href={order.trackingUrl || awbInfo?.trackingUrl || `https://my.ithinklogistics.com/track?awb=${order.awbNumber || awbInfo?.awb}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 16px",
                            borderRadius: "4px",
                            background: "#15803d",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "700",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <TruckIcon size={14} /> Live Carrier Tracking ↗
                        </a>

                        {(order.shippingLabelUrl || awbInfo?.isLive) && (
                          <a
                            href={order.shippingLabelUrl || `https://my.ithinklogistics.com/print_label?awb=${order.awbNumber || awbInfo?.awb}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "8px 16px",
                              borderRadius: "4px",
                              background: "#0d4428",
                              border: "1px solid #c59b27",
                              color: "#f5d77f",
                              fontSize: "12px",
                              fontWeight: "700",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <PrinterIcon size={14} /> Official iThink Shipping Label (PDF) ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                          Select iThink Live Courier Partner:
                        </label>
                        <select
                          value={selectedCourier}
                          onChange={(e) => setSelectedCourier(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px", fontWeight: "600" }}
                        >
                          <option value="Delhivery Surface & Express (iThink)">Delhivery Surface & Express (iThink)</option>
                          <option value="Blue Dart Air Express (iThink)">Blue Dart Air Express (iThink)</option>
                          <option value="Xpressbees Direct (iThink)">Xpressbees Direct (iThink)</option>
                          <option value="DTDC Prime Gold (iThink)">DTDC Prime Gold (iThink)</option>
                          <option value="Smartr Logistics (iThink)">Smartr Logistics (iThink)</option>
                          <option value="Ekart Surface Logistics (iThink)">Ekart Surface Logistics (iThink)</option>
                          <option value="Shadowfax Flash (iThink)">Shadowfax Flash (iThink)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                          Gross Package Weight (KG):
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={packageWeight}
                          onChange={(e) => setPackageWeight(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                        />
                      </div>
                    </div>

                    {/* DISPATCH ACTION */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: "10px 18px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={dispatching}
                        onClick={handleConfirmCourierDispatch}
                        style={{
                          padding: "10px 24px",
                          borderRadius: "4px",
                          background: "#0d4428",
                          color: "#f5d77f",
                          border: "1px solid #c59b27",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: dispatching ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ZapIcon size={14} /> {dispatching ? "Scheduling & Booking AWB..." : "Confirm & Push to iThink Logistics"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RETURNS & REFUND PROCESSING */}
          {activeTab === "refund" && (() => {
            const returnCheck = evaluateReturnEligibility(order);

            return (
              <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <RefreshCwIcon size={18} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0, color: "#111827" }}>
                        Process Return & Refund
                      </h2>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>Order #{order.orderNumber} &bull; Total Value: ₹{totalNum.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* 5-DAY RETURN POLICY STATUS BANNER */}
                  {!returnCheck.isEligible ? (
                    <div style={{ padding: "14px 18px", borderRadius: "6px", background: "#fef2f2", border: "1.5px solid #fecaca", color: "#991b1b", marginBottom: "16px", fontSize: "13px" }}>
                      <strong style={{ display: "block", marginBottom: "4px" }}>⛔ Return Processing Blocked by Policy:</strong>
                      <span>{returnCheck.message}</span>
                      <div style={{ marginTop: "6px", fontSize: "11.5px", color: "#b91c1c" }}>
                        Store policy strictly forbids manual or automated return processing for orders after 5 days of delivery.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "10px 14px", borderRadius: "6px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", marginBottom: "16px", fontSize: "12px", fontWeight: "600" }}>
                      ✓ {returnCheck.message}
                    </div>
                  )}

                  {refundSuccess ? (
                    <div style={{ padding: "24px", textAlign: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px" }}>
                      <CheckIcon size={32} className="text-green-600" />
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#166534", marginTop: "8px" }}>Refund Recorded Successfully</h3>
                      <p style={{ fontSize: "12px", color: "#15803d", margin: "4px 0 0" }}>Order status updated to RETURNED and inventory updated.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleExecuteRefund} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                          Return Reason:
                        </label>
                        <select
                          disabled={!returnCheck.isEligible}
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "13px" }}
                        >
                          <option value="Size fit alteration required">Size fit alteration required</option>
                          <option value="Customer changed preference">Customer changed preference</option>
                          <option value="Fabric / Drape exchange">Fabric / Drape exchange</option>
                          <option value="Damaged in courier transit">Damaged in courier transit</option>
                          <option value="Duplicate order cancellation">Duplicate order cancellation</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>
                          Refund / Credit Note Amount (₹):
                        </label>
                        <input
                          type="number"
                          disabled={!returnCheck.isEligible}
                          min="0"
                          max={totalNum}
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", fontWeight: "700" }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", background: "#f9fafb", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                        <input
                          type="checkbox"
                          id="restock"
                          disabled={!returnCheck.isEligible}
                          checked={restockItem}
                          onChange={(e) => setRestockItem(e.target.checked)}
                          style={{ width: "16px", height: "16px" }}
                        />
                        <label htmlFor="restock" style={{ fontSize: "12px", color: "#374151", cursor: "pointer" }}>
                          Restock items back into atelier inventory automatically
                        </label>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                        <button
                          type="button"
                          onClick={onClose}
                          style={{ padding: "10px 18px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={processingRefund || !returnCheck.isEligible}
                          style={{
                            padding: "10px 22px",
                            borderRadius: "4px",
                            border: "none",
                            background: !returnCheck.isEligible ? "#d1d5db" : "#991b1b",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: !returnCheck.isEligible ? "not-allowed" : "pointer"
                          }}
                        >
                          {processingRefund ? "Processing..." : !returnCheck.isEligible ? "Return Blocked (>5 Days)" : "Confirm Return & Refund"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* COMPREHENSIVE PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice *,
          #printable-packingslip, #printable-packingslip *,
          #printable-shippinglabel, #printable-shippinglabel *,
          #printable-combined, #printable-combined * {
            visibility: visible !important;
          }
          #printable-invoice, #printable-packingslip, #printable-shippinglabel, #printable-combined {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print, header, nav, button, aside, footer {
            display: none !important;
            visibility: hidden !important;
          }
          @page {
            margin: 10mm 12mm;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
