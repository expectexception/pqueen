"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { SearchIcon, CheckIcon, CloseIcon, SparklesIcon, TagIcon, PackageIcon } from "@/app/components/Icons";

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "gateways" | "payouts" | "fraud" | "disputes">("transactions");

  // Filter state for transactions
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [gatewayFilter, setGatewayFilter] = useState("ALL");

  // Refund Modal State
  const [refundTxn, setRefundTxn] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("Customer requested cancellation");
  const [refundAmount, setRefundAmount] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);

  // Dispute Evidence Modal State
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  const [savedMessage, setSavedMessage] = useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load payment operations data.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((t: any) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (gatewayFilter !== "ALL" && t.gateway !== gatewayFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = t.id.toLowerCase().includes(q);
        const orderMatch = t.orderNumber.toLowerCase().includes(q);
        const nameMatch = (t.customerName || "").toLowerCase().includes(q);
        const emailMatch = (t.customerEmail || "").toLowerCase().includes(q);
        return idMatch || orderMatch || nameMatch || emailMatch;
      }
      return true;
    });
  }, [data, statusFilter, gatewayFilter, search]);

  async function handleExecuteRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundTxn) return;
    setProcessingRefund(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue_refund",
          transactionId: refundTxn.id,
          orderId: refundTxn.orderId,
          refundAmount: Number(refundAmount),
          reason: refundReason,
        }),
      });
      if (!res.ok) throw new Error("Failed to process refund.");
      setSavedMessage(`Refund of ₹${Number(refundAmount).toLocaleString("en-IN")} executed successfully.`);
      setRefundTxn(null);
      await loadPayments();
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to process refund.");
    } finally {
      setProcessingRefund(false);
    }
  }

  async function handleToggleGateway(gatewayKey: string) {
    if (!data) return;
    const updatedGateways = {
      ...data.gateways,
      [gatewayKey]: {
        ...data.gateways[gatewayKey],
        enabled: !data.gateways[gatewayKey].enabled,
      },
    };
    setData({ ...data, gateways: updatedGateways });

    try {
      await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_gateways",
          gateways: updatedGateways,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmitDisputeEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDispute) return;
    setSubmittingEvidence(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_dispute_evidence",
          disputeId: activeDispute.id,
          evidenceText,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit evidence.");
      setSavedMessage("Dispute defense evidence submitted to bank.");
      setActiveDispute(null);
      await loadPayments();
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to submit evidence.");
    } finally {
      setSubmittingEvidence(false);
    }
  }

  if (loading && !data) {
    return (
      <AdminLayout title="Payment Operations & Gateways">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Loading Payment Operations Hub...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Payment Operations & Gateways">
        <p style={{ color: "#991b1b" }}>{error || "Unable to load payments."}</p>
        <button type="button" onClick={loadPayments} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  const { summary, gateways, payouts, disputes } = data;

  return (
    <AdminLayout title="Payment Operations & Gateways">
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
            FINANCIAL TRANSACTION ENGINE
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", margin: "4px 0" }}>
            Payment Operations & Gateways
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
            Real-time transaction feed, instant refund processor, gateway credentials, bank payouts, fraud logs, and chargeback disputes.
          </p>
        </div>

        {savedMessage && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "20px" }}>
            ✓ {savedMessage}
          </div>
        )}

        {/* 4 SUMMARY FINANCIAL METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "20px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Gross Volume</span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0d4428", margin: "6px 0" }}>
              ₹{Number(summary.totalVolume).toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Across {summary.transactionCount} transactions</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "20px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Net Merchant Settlement</span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#c59b27", margin: "6px 0" }}>
              ₹{Number(summary.netVolume).toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "#15803d" }}>₹{Number(summary.totalFees).toLocaleString("en-IN")} gateway fees deducted</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "20px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase" }}>In-Flight / Pending</span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#b45309", margin: "6px 0" }}>
              ₹{Number(summary.pendingVolume).toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Awaiting bank clearance</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "20px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Refunded</span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#991b1b", margin: "6px 0" }}>
              ₹{Number(summary.refundedVolume).toLocaleString("en-IN")}
            </div>
            <span style={{ fontSize: "11px", color: "#991b1b" }}>Returned to original source</span>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "24px" }}>
          {[
            { id: "transactions", label: "📑 Real-Time Transactions" },
            { id: "gateways", label: "💳 Gateway Integrations" },
            { id: "payouts", label: "🏦 Bank Payouts" },
            { id: "fraud", label: "🛡️ Fraud Detection Logs" },
            { id: "disputes", label: `⚖️ Disputes & Chargebacks (${disputes?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                border: "none",
                background: activeTab === tab.id ? "#0d4428" : "#f0f4f1",
                color: activeTab === tab.id ? "#f5d77f" : "#4a6350",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: REAL-TIME TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            {/* FILTER BAR */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search by Txn ID, Order #, or Customer..."
                    className="form-input"
                    style={{ paddingLeft: "32px", fontSize: "12.5px" }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                    <SearchIcon size={14} />
                  </div>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "150px", fontSize: "12px" }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="FAILED">Failed</option>
                </select>

                <select
                  value={gatewayFilter}
                  onChange={(e) => setGatewayFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "160px", fontSize: "12px" }}
                >
                  <option value="ALL">All Gateways</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="UPI">UPI Direct</option>
                  <option value="Stripe">Stripe</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </div>

              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Showing <strong>{filteredTransactions.length}</strong> transactions
              </span>
            </div>

            {/* TRANSACTIONS TABLE */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Transaction ID</th>
                  <th style={{ padding: "10px 12px" }}>Order</th>
                  <th style={{ padding: "10px 12px" }}>Customer</th>
                  <th style={{ padding: "10px 12px" }}>Gateway</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Gross Amount</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Net Settlement</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t: any) => {
                  const statusColors =
                    t.status === "SUCCESS"
                      ? { bg: "#dcfce7", color: "#15803d" }
                      : t.status === "REFUNDED"
                      ? { bg: "#fee2e2", color: "#991b1b" }
                      : t.status === "PENDING"
                      ? { bg: "#fef3c7", color: "#b45309" }
                      : { bg: "#f3f4f6", color: "#6b7280" };

                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "11px", color: "#0d4428", fontWeight: "700" }}>
                        {t.id}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <strong>#{t.orderNumber}</strong>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <strong style={{ color: "#111827", display: "block" }}>{t.customerName}</strong>
                        <span style={{ fontSize: "10.5px", color: "#6b7280" }}>{t.customerEmail}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#f3f4f6", fontSize: "11px", fontWeight: "600" }}>
                          {t.gateway}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: "700" }}>
                        ₹{Number(t.gross).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#0d4428", fontWeight: "700" }}>
                        ₹{Number(t.net).toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "10px", background: statusColors.bg, color: statusColors.color, fontSize: "10.5px", fontWeight: "800" }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {t.status === "SUCCESS" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRefundTxn(t);
                              setRefundAmount(String(t.gross));
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #fecaca",
                              background: "#fff",
                              color: "#991b1b",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: GATEWAY INTEGRATIONS */}
        {activeTab === "gateways" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {[
              { key: "razorpay", name: "Razorpay (Cards, UPI, Netbanking)", desc: "Primary payment gateway for India transactions with instant checkout modal." },
              { key: "stripe", name: "Stripe Global Payments", desc: "Accept international credit/debit cards with automated currency conversion." },
              { key: "paypal", name: "PayPal Express", desc: "Allow international and diaspora buyers to pay securely with their PayPal balance." },
              { key: "applePay", name: "Apple Pay / Google Pay Direct", desc: "1-touch biometrics checkout on iOS and Android devices." },
              { key: "klarna", name: "Klarna (Buy Now Pay Later)", desc: "Allow couture customers to split purchases into 4 interest-free installments." },
              { key: "upi", name: "UPI Direct QR / VPA", desc: "Zero-fee direct bank transfers via PhonePe, Google Pay, and Paytm." },
            ].map((gw) => {
              const config = gateways[gw.key] || { enabled: false, mode: "test" };
              return (
                <div key={gw.key} style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#111827" }}>{gw.name}</h3>
                    <button
                      type="button"
                      onClick={() => handleToggleGateway(gw.key)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "14px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: config.enabled ? "#0d4428" : "#e5e7eb",
                        color: config.enabled ? "#f5d77f" : "#4b5563",
                      }}
                    >
                      {config.enabled ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "0 0 16px", lineHeight: "1.4" }}>
                    {gw.desc}
                  </p>
                  <div style={{ padding: "8px 12px", background: "#fafaf9", borderRadius: "4px", border: "1px solid #e5e7eb", fontSize: "11px", display: "flex", justifyContent: "space-between" }}>
                    <span>Mode: <strong>{config.mode?.toUpperCase() || "TEST"}</strong></span>
                    <span style={{ color: "#15803d", fontWeight: "700" }}>✓ Webhook Connected</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: BANK PAYOUTS */}
        {activeTab === "payouts" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "16px" }}>
              Merchant Bank Payouts & Transfers
            </h2>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>Payout ID</th>
                  <th style={{ padding: "10px 14px" }}>Processor</th>
                  <th style={{ padding: "10px 14px" }}>Destination Bank</th>
                  <th style={{ padding: "10px 14px" }}>Expected Arrival</th>
                  <th style={{ padding: "10px 14px" }}>Transactions</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Payout Amount</th>
                  <th style={{ padding: "10px 14px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts?.map((po: any) => (
                  <tr key={po.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#0d4428", fontWeight: "700" }}>{po.id}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "600" }}>{po.gateway}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{po.destinationBank}</td>
                    <td style={{ padding: "12px 14px" }}>{po.arrivalDate}</td>
                    <td style={{ padding: "12px 14px" }}>{po.transactionCount} orders batch</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: "#0d4428", fontSize: "13px" }}>
                      ₹{Number(po.amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "10.5px",
                          fontWeight: "800",
                          background: po.status === "PAID" ? "#dcfce7" : po.status === "IN_TRANSIT" ? "#e0f2fe" : "#fef3c7",
                          color: po.status === "PAID" ? "#15803d" : po.status === "IN_TRANSIT" ? "#0369a1" : "#b45309",
                        }}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: FRAUD DETECTION LOGS */}
        {activeTab === "fraud" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "4px" }}>
              Automated Fraud Detection & Risk Scoring
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
              Machine learning risk assessment for card verification, 3D secure, and IP velocity.
            </span>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Transaction / Order</th>
                  <th style={{ padding: "10px 12px" }}>IP Geolocation</th>
                  <th style={{ padding: "10px 12px" }}>3D Secure</th>
                  <th style={{ padding: "10px 12px" }}>CVC Match</th>
                  <th style={{ padding: "10px 12px" }}>Risk Score</th>
                  <th style={{ padding: "10px 12px" }}>Risk Level</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Security Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t: any) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <strong style={{ color: "#111827" }}>#{t.orderNumber}</strong>
                      <span style={{ fontSize: "10px", color: "#6b7280", display: "block" }}>{t.id}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "11px" }}>{t.ipAddress} (IN)</td>
                    <td style={{ padding: "10px 12px", color: t.threeDSecure ? "#15803d" : "#6b7280", fontWeight: "700" }}>
                      {t.threeDSecure ? "✓ Passed" : "N/A"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#15803d", fontWeight: "700" }}>✓ Matched</td>
                    <td style={{ padding: "10px 12px", fontWeight: "800" }}>{t.riskScore} / 100</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "800",
                          background: t.riskLevel === "NORMAL" ? "#dcfce7" : t.riskLevel === "MEDIUM" ? "#fef3c7" : "#fee2e2",
                          color: t.riskLevel === "NORMAL" ? "#15803d" : t.riskLevel === "MEDIUM" ? "#b45309" : "#991b1b",
                        }}
                      >
                        {t.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "700" }}>Authorized</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: DISPUTES & CHARGEBACKS */}
        {activeTab === "disputes" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "4px" }}>
              Credit Card Disputes & Chargebacks Hub
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
              Review customer disputes, view evidence submission deadlines, and upload courier proof of delivery.
            </span>

            {disputes?.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#15803d", background: "#f0fdf4", borderRadius: "6px" }}>
                <CheckIcon size={24} />
                <h3 style={{ fontSize: "15px", fontWeight: "700", marginTop: "6px" }}>Zero Active Chargebacks</h3>
                <p style={{ fontSize: "12px", color: "#166534", margin: 0 }}>Your store is in 100% good standing with all card networks.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {disputes?.map((dp: any) => (
                  <div
                    key={dp.id}
                    style={{
                      padding: "20px",
                      border: "1px solid #fee2e2",
                      borderRadius: "8px",
                      background: "#fff9f9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "10px", background: "#fee2e2", color: "#991b1b", fontSize: "10.5px", fontWeight: "800" }}>
                          {dp.status}
                        </span>
                        <strong style={{ fontSize: "14px", color: "#111827" }}>Dispute #{dp.id} &bull; Order #{dp.orderNumber}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#374151", marginBottom: "4px" }}>
                        <strong>Customer:</strong> {dp.customerName} &bull; <strong>Reason:</strong> {dp.reason}
                      </div>
                      <span style={{ fontSize: "11px", color: "#991b1b", fontWeight: "700" }}>
                        Evidence Deadline: {dp.evidenceDue}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#991b1b", marginBottom: "8px" }}>
                        ₹{Number(dp.amount).toLocaleString("en-IN")}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDispute(dp);
                          setEvidenceText(dp.evidenceText || "");
                        }}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "4px",
                          background: "#0d4428",
                          color: "#f5d77f",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Contest & Upload Proof
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REFUND MODAL */}
      {refundTxn && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRefundTxn(null);
          }}
        >
          <div style={{ width: "100%", maxWidth: "480px", background: "#fff", borderRadius: "8px", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "12px" }}>
              Direct Gateway Refund
            </h2>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
              Refund will be dispatched back to customer's original method ({refundTxn.gateway}).
            </p>

            <form onSubmit={handleExecuteRefund} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Refund Amount (₹):</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={refundTxn.gross}
                  className="form-input"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Reason for Refund:</label>
                <select
                  className="form-input"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Duplicate transaction">Duplicate transaction</option>
                  <option value="Item returned / fit alteration">Item returned / fit alteration</option>
                  <option value="Fraudulent transaction claim">Fraudulent transaction claim</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRefundTxn(null)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRefund}
                  style={{ padding: "8px 20px", borderRadius: "4px", border: "none", background: "#991b1b", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                >
                  {processingRefund ? "Processing..." : "Issue Direct Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPUTE EVIDENCE MODAL */}
      {activeDispute && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDispute(null);
          }}
        >
          <div style={{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "8px", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "10px" }}>
              Submit Dispute Defense Evidence
            </h2>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
              Contest Chargeback #{activeDispute.id} (Claim: ₹{Number(activeDispute.amount).toLocaleString("en-IN")})
            </p>

            <form onSubmit={handleSubmitDisputeEvidence} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Defense Statement & Courier Tracking Details:</label>
                <textarea
                  rows={4}
                  required
                  className="form-input"
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveDispute(null)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence}
                  className="btn-primary"
                  style={{ padding: "8px 20px" }}
                >
                  {submittingEvidence ? "Submitting..." : "Submit Evidence to Card Network"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
