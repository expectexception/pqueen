"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { CheckIcon, PlusIcon, TrashIcon, SparklesIcon, TagIcon } from "@/app/components/Icons";

export default function AdminTaxesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"calculator" | "categories" | "exemptions" | "nexus">("calculator");

  // Geolocation Simulator State
  const [simState, setSimState] = useState("Delhi (Intra-State Home)");
  const [simAmount, setSimAmount] = useState(25000);
  const [simCategory, setSimCategory] = useState("Designer Lehengas");

  // Exemption Modal State
  const [isExemptionModalOpen, setIsExemptionModalOpen] = useState(false);
  const [newExemption, setNewExemption] = useState({
    customerName: "",
    customerEmail: "",
    businessName: "",
    gstinOrTaxId: "",
    exemptionType: "B2B_WHOLESALE",
    validUntil: "2027-03-31",
  });

  const [savedMessage, setSavedMessage] = useState("");

  async function loadTaxes() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/taxes");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load tax configuration.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load taxes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTaxes();
  }, []);

  async function handleToggleExemption(id: string) {
    if (!data) return;
    const updated = data.exemptions.map((e: any) => (e.id === id ? { ...e, active: !e.active } : e));
    setData({ ...data, exemptions: updated });

    try {
      await fetch("/api/admin/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_exemption", exemptionId: id }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteExemption(id: string) {
    if (!confirm("Are you sure you want to revoke this customer's tax exemption?")) return;
    if (!data) return;

    const updated = data.exemptions.filter((e: any) => e.id !== id);
    setData({ ...data, exemptions: updated });

    try {
      await fetch("/api/admin/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_exemption", exemptionId: id }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddExemption(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_exemption",
          exemption: newExemption,
        }),
      });
      if (!res.ok) throw new Error("Failed to add tax exemption.");
      setIsExemptionModalOpen(false);
      setNewExemption({
        customerName: "",
        customerEmail: "",
        businessName: "",
        gstinOrTaxId: "",
        exemptionType: "B2B_WHOLESALE",
        validUntil: "2027-03-31",
      });
      setSavedMessage("Tax exemption granted successfully.");
      await loadTaxes();
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to add exemption.");
    }
  }

  if (loading && !data) {
    return (
      <AdminLayout title="Tax Management & Compliance">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Loading Tax Engine...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Tax Management & Compliance">
        <p style={{ color: "#991b1b" }}>{error || "Unable to load taxes."}</p>
        <button type="button" onClick={loadTaxes} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  const { jurisdictionRules, categoryTaxRates, exemptions, nexusThresholds } = data;

  // Compute Simulator Results
  const selectedRule = jurisdictionRules.find((r: any) => r.stateOrCountry === simState) || jurisdictionRules[0];
  const selectedCat = categoryTaxRates.find((c: any) => c.categoryName === simCategory) || categoryTaxRates[0];

  let appliedRate = selectedRule.rate;
  if (selectedCat.luxuryThresholdAmount && simAmount > selectedCat.luxuryThresholdAmount) {
    appliedRate = selectedCat.luxuryThresholdRate || 18;
  }
  if (selectedRule.taxType === "ZERO_RATED") {
    appliedRate = 0;
  }

  const simTaxAmount = Math.round((simAmount * appliedRate) / 100);
  const simTotal = simAmount + simTaxAmount;

  return (
    <AdminLayout title="Tax Management & Compliance">
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
            STATUTORY COMPLIANCE & JURISDICTION ENGINE
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", margin: "4px 0" }}>
            Tax Management & Geolocation Rates
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
            Automated destination-based GST/VAT tax calculator, category rates, B2B wholesale exemptions, and state nexus threshold monitoring.
          </p>
        </div>

        {savedMessage && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "20px" }}>
            ✓ {savedMessage}
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "24px" }}>
          {[
            { id: "calculator", label: "📍 Geolocation Tax Simulator" },
            { id: "categories", label: "👗 Category Tax Rates" },
            { id: "exemptions", label: `🏢 B2B Exemptions (${exemptions?.length || 0})` },
            { id: "nexus", label: "📊 Nexus Threshold Tracker" },
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

        {/* TAB 1: GEOLOCATION TAX SIMULATOR & JURISDICTION RULES */}
        {activeTab === "calculator" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* LIVE SIMULATOR WIDGET */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px" }}>
                Real-Time Geolocation Destination Tax Calculator
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
                Simulate checkout tax calculations for any state or international export destination in real time.
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "center" }}>
                {/* CONTROLS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Shipping Destination State / Country:</label>
                    <select
                      className="form-input"
                      value={simState}
                      onChange={(e) => setSimState(e.target.value)}
                    >
                      {jurisdictionRules.map((r: any, idx: number) => (
                        <option key={idx} value={r.stateOrCountry}>
                          {r.stateOrCountry} ({r.taxType} - {r.rate}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Garment Category:</label>
                      <select
                        className="form-input"
                        value={simCategory}
                        onChange={(e) => setSimCategory(e.target.value)}
                      >
                        {categoryTaxRates.map((c: any, idx: number) => (
                          <option key={idx} value={c.categoryName}>
                            {c.categoryName} (HSN: {c.hsnCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Item Price (₹):</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        className="form-input"
                        value={simAmount}
                        onChange={(e) => setSimAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* CALCULATION RESULT CARD */}
                <div style={{ background: "#f6f9f7", padding: "20px", borderRadius: "8px", border: "1px solid #cce2d3" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                    <span>Taxable Base Value:</span>
                    <strong>₹{simAmount.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", color: "#4b5563" }}>
                    <span>Applied Rate ({selectedRule.taxType}):</span>
                    <strong style={{ color: "#0d4428" }}>{appliedRate}%</strong>
                  </div>

                  {selectedRule.cgstRate !== undefined && selectedRule.cgstRate > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px", color: "#6b7280" }}>
                      <span>CGST ({selectedRule.cgstRate}%):</span>
                      <span>₹{(simTaxAmount / 2).toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {selectedRule.sgstRate !== undefined && selectedRule.sgstRate > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px", color: "#6b7280" }}>
                      <span>SGST ({selectedRule.sgstRate}%):</span>
                      <span>₹{(simTaxAmount / 2).toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", borderTop: "2px solid #0d4428", marginTop: "8px", fontSize: "15px", fontWeight: "800", color: "#0d4428" }}>
                    <span>Total with Taxes:</span>
                    <span>₹{simTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* JURISDICTION RULES TABLE */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "16px" }}>
                Configured State & Global Tax Rules
              </h2>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px" }}>Jurisdiction / Destination</th>
                    <th style={{ padding: "10px 14px" }}>Tax Regime</th>
                    <th style={{ padding: "10px 14px" }}>Tax Rate</th>
                    <th style={{ padding: "10px 14px" }}>Breakdown</th>
                    <th style={{ padding: "10px 14px" }}>Statutory Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {jurisdictionRules.map((rule: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: "700", color: "#111827" }}>{rule.stateOrCountry}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "10px", background: "rgba(13,68,40,0.1)", color: "#0d4428", fontWeight: "700" }}>
                          {rule.taxType}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0d4428" }}>{rule.rate}%</td>
                      <td style={{ padding: "12px 14px", color: "#4b5563" }}>
                        {rule.cgstRate > 0 ? `CGST: ${rule.cgstRate}% + SGST: ${rule.sgstRate}%` : rule.igstRate > 0 ? `IGST: ${rule.igstRate}%` : "Zero-Rated (LUT)"}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: "11px" }}>{rule.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT CATEGORY TAX RATES */}
        {activeTab === "categories" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "4px" }}>
              Apparel Category Tax Rates & HSN Codes
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
              Assign distinct tax rates according to HSN Harmonized System Codes and luxury price thresholds.
            </span>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>Category Name</th>
                  <th style={{ padding: "10px 14px" }}>HSN Code</th>
                  <th style={{ padding: "10px 14px" }}>Standard Rate</th>
                  <th style={{ padding: "10px 14px" }}>Luxury Surcharge Threshold</th>
                  <th style={{ padding: "10px 14px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {categoryTaxRates.map((cat: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#111827" }}>{cat.categoryName}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#0d4428", fontWeight: "700" }}>{cat.hsnCode}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "700" }}>{cat.standardRate}% GST</td>
                    <td style={{ padding: "12px 14px", color: cat.luxuryThresholdAmount ? "#b45309" : "#6b7280" }}>
                      {cat.luxuryThresholdAmount ? `Items > ₹${cat.luxuryThresholdAmount.toLocaleString("en-IN")} taxed at ${cat.luxuryThresholdRate}%` : "No luxury surcharge"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#15803d", fontWeight: "700" }}>✓ Active Compliance</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: B2B TAX EXEMPTIONS */}
        {activeTab === "exemptions" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                  B2B Wholesale & SEZ Tax Exemptions ({exemptions.length})
                </h2>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Registered wholesale buyers and special economic zone partners with approved zero-tax status.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExemptionModalOpen(true)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  background: "#0d4428",
                  color: "#f5d77f",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <PlusIcon size={14} /> ADD EXEMPTION
              </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>Business / Patron</th>
                  <th style={{ padding: "10px 14px" }}>GSTIN / Tax ID</th>
                  <th style={{ padding: "10px 14px" }}>Exemption Category</th>
                  <th style={{ padding: "10px 14px" }}>Valid Until</th>
                  <th style={{ padding: "10px 14px" }}>Status</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exemptions.map((ex: any) => (
                  <tr key={ex.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <strong style={{ color: "#111827", display: "block" }}>{ex.businessName}</strong>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>{ex.customerName} &bull; {ex.customerEmail}</span>
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#0d4428", fontWeight: "700" }}>
                      {ex.gstinOrTaxId}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "10px", background: "#f0f7f3", color: "#0d4428", fontWeight: "700", fontSize: "10.5px" }}>
                        {ex.exemptionType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#4b5563" }}>{ex.validUntil}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleExemption(ex.id)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "10.5px",
                          fontWeight: "800",
                          cursor: "pointer",
                          border: "none",
                          background: ex.active ? "#dcfce7" : "#f3f4f6",
                          color: ex.active ? "#15803d" : "#6b7280",
                        }}
                      >
                        {ex.active ? "EXEMPT" : "INACTIVE"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteExemption(ex.id)}
                        style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #fee2e2", background: "#fff", color: "#991b1b", cursor: "pointer" }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: NEXUS THRESHOLD TRACKER */}
        {activeTab === "nexus" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "4px" }}>
              State & Regional Economic Nexus Threshold Monitor
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "24px" }}>
              Track sales volume toward mandatory state GST tax registration thresholds.
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {nexusThresholds.map((nx: any, idx: number) => {
                const percent = Math.min(100, Math.round((nx.currentVolume / nx.statutoryLimit) * 100));
                const barColor = percent > 80 ? "#b45309" : percent > 50 ? "#c59b27" : "#0d4428";

                return (
                  <div key={idx} style={{ padding: "16px", border: "1px solid var(--border-subtle)", borderRadius: "6px", background: "#fafaf9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "14px", color: "#111827" }}>{nx.jurisdiction}</strong>
                        <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "8px" }}>
                          ({nx.ordersCount} shipments dispatched)
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: barColor }}>
                          ₹{Number(nx.currentVolume).toLocaleString("en-IN")} / ₹{Number(nx.statutoryLimit).toLocaleString("en-IN")} ({percent}%)
                        </span>
                      </div>
                    </div>

                    <div style={{ width: "100%", height: "10px", background: "#e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: barColor, borderRadius: "10px", transition: "width 0.4s ease" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "#6b7280" }}>
                      <span>Safe Zone (Under ₹{Number(nx.statutoryLimit).toLocaleString("en-IN")} threshold)</span>
                      <span style={{ color: barColor, fontWeight: "700" }}>{nx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ADD EXEMPTION MODAL */}
      {isExemptionModalOpen && (
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
            if (e.target === e.currentTarget) setIsExemptionModalOpen(false);
          }}
        >
          <div style={{ width: "100%", maxWidth: "520px", background: "#fff", borderRadius: "8px", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "16px" }}>
              Add B2B Wholesale Tax Exemption
            </h2>

            <form onSubmit={handleAddExemption} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Business / Trading Name:</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newExemption.businessName}
                  onChange={(e) => setNewExemption({ ...newExemption, businessName: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Contact Person Name:</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newExemption.customerName}
                    onChange={(e) => setNewExemption({ ...newExemption, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Official Email:</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={newExemption.customerEmail}
                    onChange={(e) => setNewExemption({ ...newExemption, customerEmail: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>GSTIN / Tax ID Number:</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ textTransform: "uppercase", fontWeight: "700" }}
                    value={newExemption.gstinOrTaxId}
                    onChange={(e) => setNewExemption({ ...newExemption, gstinOrTaxId: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Exemption Category:</label>
                  <select
                    className="form-input"
                    value={newExemption.exemptionType}
                    onChange={(e) => setNewExemption({ ...newExemption, exemptionType: e.target.value })}
                  >
                    <option value="B2B_WHOLESALE">B2B Wholesale Buyer</option>
                    <option value="SEZ_EXPORT">SEZ Export Unit</option>
                    <option value="DIPLOMATIC">Diplomatic Exemption</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsExemptionModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "8px 20px" }}>
                  Grant Exemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
