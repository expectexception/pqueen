"use client";

import React, { Suspense, useEffect, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { BarChartIcon, CheckIcon, SparklesIcon, TagIcon, PackageIcon } from "@/app/components/Icons";

function AdminReportsContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  async function loadReports() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reports");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load financial reports.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function handleDownloadCSV() {
    setDownloading(true);
    window.location.href = "/api/admin/reports?export=csv";
    setTimeout(() => setDownloading(false), 2000);
  }

  function handlePrintReport() {
    window.print();
  }

  if (loading && !data) {
    return (
      <AdminLayout title="Financial Intelligence & Reports">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Computing Financial Reports...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Financial Intelligence & Reports">
        <p style={{ color: "#991b1b" }}>{error || "Unable to load financial reports."}</p>
        <button type="button" onClick={loadReports} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  const { waterfall, taxLiabilityList, paymentMethods } = data;

  return (
    <AdminLayout
      title="Financial Intelligence & Reports"
      actions={
        <div className="no-print" style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={downloading}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: "#0d4428",
              color: "#f5d77f",
              border: "none",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📥 {downloading ? "Exporting..." : "Export QuickBooks / Xero CSV"}
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: "#fff",
              color: "#0d4428",
              border: "1px solid #0d4428",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            🖨️ Print Financial Statement
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
            EXECUTIVE ACCOUNTING AUDIT
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", margin: "4px 0" }}>
            Financial Intelligence & Tax Liability Reports
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
            Gross-to-Net revenue waterfall analysis, state-wise GST tax liabilities, payment method share, and accounting export tools.
          </p>
        </div>

        {/* 1. GROSS VS NET REVENUE WATERFALL */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0 }}>
                Gross vs. Net Operating Revenue Waterfall
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Audited breakdown of gross sales, returns, discounts, payment processor fees, and tax liabilities
              </span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", background: "rgba(13,68,40,0.1)", padding: "3px 10px", borderRadius: "10px", textTransform: "uppercase" }}>
              INR (₹) AUDIT
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", background: "#f6f9f7", padding: "20px", borderRadius: "8px", border: "1px solid #cce2d3" }}>
            {/* Step 1: Gross Sales */}
            <div>
              <span style={{ fontSize: "10.5px", color: "#4b5563", fontWeight: "700", textTransform: "uppercase" }}>1. Gross Sales</span>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#0d4428", margin: "4px 0" }}>
                ₹{Number(waterfall.grossSales).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>Total checkout volume</span>
            </div>

            {/* Step 2: Refunds */}
            <div>
              <span style={{ fontSize: "10.5px", color: "#991b1b", fontWeight: "700", textTransform: "uppercase" }}>2. (-) Refunds</span>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#991b1b", margin: "4px 0" }}>
                -₹{Number(waterfall.refundDeductions).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>Customer returns</span>
            </div>

            {/* Step 3: Discounts */}
            <div>
              <span style={{ fontSize: "10.5px", color: "#b45309", fontWeight: "700", textTransform: "uppercase" }}>3. (-) Discounts</span>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#b45309", margin: "4px 0" }}>
                -₹{Number(waterfall.estimatedDiscounts).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>Voucher promos (PQN10)</span>
            </div>

            {/* Step 4: Gateway Fees */}
            <div>
              <span style={{ fontSize: "10.5px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase" }}>4. (-) Gateway Fees</span>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#4b5563", margin: "4px 0" }}>
                -₹{Number(waterfall.paymentGatewayFees).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>2% Processor charges</span>
            </div>

            {/* Step 5: Taxes */}
            <div>
              <span style={{ fontSize: "10.5px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase" }}>5. (-) GST Taxes</span>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#4b5563", margin: "4px 0" }}>
                -₹{Number(waterfall.taxCollected).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "#6b7280" }}>Govt GST component</span>
            </div>

            {/* Step 6: Net Operating Margin */}
            <div style={{ background: "#0d4428", padding: "10px 14px", borderRadius: "6px", color: "#fff" }}>
              <span style={{ fontSize: "10.5px", color: "#f5d77f", fontWeight: "800", textTransform: "uppercase" }}>6. Net Retained Profit</span>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#f5d77f", margin: "4px 0" }}>
                ₹{Number(waterfall.netOperatingProfit).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "#e6f0ea" }}>Atelier Net Cashflow</span>
            </div>
          </div>
        </div>

        {/* 2. STATE & COUNTRY TAX LIABILITY REPORT (GSTR-1 READY) */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                State-Wise GST Tax Liability Schedule (GSTR-1)
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Tax liability report grouped by destination state for monthly GST filing
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "700" }}>
              ✓ GSTR-1 Format Ready
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>Destination Jurisdiction</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>Shipments</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Taxable Sales</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>CGST (6%)</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>SGST (6%)</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>IGST (12%)</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>Total Tax Collected</th>
              </tr>
            </thead>
            <tbody>
              {taxLiabilityList.map((st: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: "700", color: "#111827" }}>{st.state}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", color: "#4b5563" }}>{st.orderCount}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700" }}>₹{Number(st.taxableSales).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", color: "#6b7280" }}>₹{Number(st.cgst).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", color: "#6b7280" }}>₹{Number(st.sgst).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", color: "#6b7280" }}>₹{Number(st.igst).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: "#0d4428" }}>₹{Number(st.totalTax).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. PAYMENT METHOD DISTRIBUTION & ACCOUNTING EXPORTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
          {/* Payment Method Breakdown */}
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px" }}>
              Payment Method Breakdown
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
              Volume and market share distribution by payment instrument
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {paymentMethods.map((pm: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                    <strong style={{ color: "#111827" }}>{pm.method}</strong>
                    <span style={{ color: "#0d4428", fontWeight: "700" }}>
                      ₹{Number(pm.volume).toLocaleString("en-IN")} ({pm.share})
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#f3f4f6", borderRadius: "10px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: pm.share,
                        height: "100%",
                        background: idx === 0 ? "#0d4428" : idx === 1 ? "#c59b27" : idx === 2 ? "#15803d" : "#6b7280",
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Export Formats */}
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px" }}>
              Accounting Software Exports
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
              Download pre-formatted data for automated bookkeeping
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px", border: "1px solid var(--border-subtle)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "block" }}>QuickBooks & Xero General Ledger</strong>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Standard Chart of Accounts (COA) CSV format</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  style={{ padding: "6px 12px", borderRadius: "4px", background: "#0d4428", color: "#f5d77f", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  Download CSV
                </button>
              </div>

              <div style={{ padding: "14px", border: "1px solid var(--border-subtle)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "block" }}>Tally ERP 9 / Prime & Zoho Books</strong>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Sales register & GST tax ledger format</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  style={{ padding: "6px 12px", borderRadius: "4px", background: "#0d4428", color: "#f5d77f", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, header, nav, aside, .admin-sidebar, button, .floating-ai-button {
            display: none !important;
            visibility: hidden !important;
          }
          div[class*="sidebar"], nav, header {
            display: none !important;
          }
          main, div[style*="maxWidth"] {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            margin: 10mm 12mm;
            size: portrait;
          }
        }
      `}</style>
    </AdminLayout>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px 20px", textAlign: "center", fontFamily: "var(--font-serif)" }}>Loading Financial Intelligence...</div>}>
      <AdminReportsContent />
    </Suspense>
  );
}
