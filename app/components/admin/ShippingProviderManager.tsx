"use client";

import React, { useState, useEffect } from "react";
import {
  TruckIcon,
  CheckIcon,
  ShieldCheckIcon,
  SettingsIcon,
  DownloadCloudIcon,
  LockIcon,
} from "@/app/components/Icons";

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  website: string;
  enabled: boolean;
  connected: boolean;
  lastTestedAt?: string;
  lastError?: string;
  priority: number;
  credentials: Record<string, string>;
  supportedModes: string[];
}

export default function ShippingProviderManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [engineSettings, setEngineSettings] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Rate Testing Sandbox
  const [testPincode, setTestPincode] = useState("110001");
  const [testWeight, setTestWeight] = useState("0.8");
  const [testIsCod, setTestIsCod] = useState(false);
  const [calculatingRates, setCalculatingRates] = useState(false);
  const [rateQuotes, setRateQuotes] = useState<any[] | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/shipping/providers");
      if (!res.ok) throw new Error("Failed to load shipping engine configuration");
      const data = await res.json();
      setEngineSettings(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection(providerId: string, customCreds?: any) {
    try {
      setTestingId(providerId);
      const res = await fetch(`/api/admin/shipping/providers/${providerId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customCreds && Object.keys(customCreds).length > 0 ? { credentials: customCreds } : {}),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: data.success, message: data.message },
      }));
      await fetchProviders();
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, message: err.message || "Connection failed" },
      }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleOriginPincodeChange(pincode: string) {
    const cleanPin = pincode.replace(/\D/g, "").slice(0, 6);
    setEngineSettings((prev: any) => ({
      ...prev,
      pickupLocation: {
        ...(prev?.pickupLocation || {}),
        pincode: cleanPin,
      },
    }));

    if (cleanPin.length === 6) {
      try {
        const res = await fetch(`/api/pincode/${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (data.city || data.district || data.state) {
            setEngineSettings((prev: any) => ({
              ...prev,
              pickupLocation: {
                ...(prev?.pickupLocation || {}),
                pincode: cleanPin,
                city: data.city || data.district || prev?.pickupLocation?.city || "",
                state: data.state || prev?.pickupLocation?.state || "",
              },
            }));
          }
        }
      } catch {
        // Allow manual typing
      }
    }
  }

  async function handleSaveGlobalSettings() {
    try {
      setSaving(true);
      setSuccessMsg("");
      setErrorMsg("");

      const res = await fetch("/api/admin/shipping/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(engineSettings),
      });

      if (!res.ok) throw new Error("Failed to save shipping settings");
      setSuccessMsg("Shipping engine configuration and warehouse rules saved successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await fetchProviders();
    } catch (err: any) {
      setErrorMsg(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProviderModal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProvider) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/shipping/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          providerConfig: selectedProvider,
        }),
      });

      if (!res.ok) throw new Error("Failed to update provider settings");
      setIsConfigModalOpen(false);
      setSuccessMsg(`${selectedProvider.name} configuration updated.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchProviders();
    } catch (err: any) {
      alert("Error saving provider: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCalculateLiveRates() {
    try {
      setCalculatingRates(true);
      setRateQuotes(null);
      const res = await fetch("/api/admin/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPincode: testPincode,
          weightKg: parseFloat(testWeight) || 0.8,
          isCod: testIsCod,
          orderValue: 4990,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRateQuotes(data.quotes || []);
      }
    } catch (err) {
      console.error("Rate check failed", err);
    } finally {
      setCalculatingRates(false);
    }
  }

  if (loading || !engineSettings) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        Loading Multi-Provider Shipping Engine...
      </div>
    );
  }

  const providersList = Object.values(engineSettings.providers || {}) as ProviderConfig[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700" }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700" }}>
          ✕ {errorMsg}
        </div>
      )}

      {/* SECTION 1: SHIPPING ENGINE MODES & LOGISTICS RULES */}
      <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "19px", margin: 0, color: "#0d4428" }}>
              Multi-Provider Shipping Engine & Smart Routing
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
              Automated courier selection, real-time rate shopping, and seamless shipment lifecycle management.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveGlobalSettings}
            disabled={saving}
            className="btn-primary"
            style={{ padding: "8px 20px", fontSize: "12px" }}
          >
            {saving ? "SAVING..." : "SAVE ROUTING RULES"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              Automated Courier Selection Strategy
            </label>
            <select
              className="form-input"
              value={engineSettings.selectionMode || "cheapest"}
              onChange={(e) => setEngineSettings({ ...engineSettings, selectionMode: e.target.value })}
            >
              <option value="cheapest">Automatic: Best Rate / Lowest Shipping Cost</option>
              <option value="fastest">Automatic: Fastest Delivery TAT (Express Air)</option>
              <option value="best_rated">Automatic: Highest Carrier Service Rating</option>
              <option value="priority">Priority Order Hierarchy (Strict Provider Rank)</option>
              <option value="manual">Manual Selection (Prompt admin for every order)</option>
            </select>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              The shipping engine calculates live quotes across all active providers at fulfillment time.
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
              Primary Default Courier Provider
            </label>
            <select
              className="form-input"
              value={engineSettings.primaryProvider || "shiprocket"}
              onChange={(e) => setEngineSettings({ ...engineSettings, primaryProvider: e.target.value })}
            >
              <option value="shiprocket">Shiprocket (Multi-Courier Aggregator)</option>
              <option value="nimbuspost">NimbusPost (Automated Logistics)</option>
              <option value="ithink">iThink Logistics (AI Smart NDR)</option>
              <option value="shipmozo">Shipmozo (Next-Gen Logistics)</option>
              <option value="delhivery">Delhivery Direct Enterprise</option>
              <option value="bluedart">Blue Dart Express</option>
              <option value="dtdc">DTDC Prime Gold</option>
              <option value="manual">Custom / Private Express Logistics</option>
            </select>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              Fallback primary provider when automatic quotes are comparable.
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
              Complimentary Free Shipping (₹)
            </label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={engineSettings.complimentaryFreeShippingThreshold ?? 0}
              onChange={(e) =>
                setEngineSettings({ ...engineSettings, complimentaryFreeShippingThreshold: Number(e.target.value) })
              }
            />
            <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>0 = Free luxury delivery for all orders</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
              Standard Shipping Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={engineSettings.standardShippingFee ?? 0}
              onChange={(e) =>
                setEngineSettings({ ...engineSettings, standardShippingFee: Number(e.target.value) })
              }
            />
            <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>When below complimentary threshold</span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
              COD Additional Surcharge (₹)
            </label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={engineSettings.codAdditionalFee ?? 0}
              onChange={(e) =>
                setEngineSettings({ ...engineSettings, codAdditionalFee: Number(e.target.value) })
              }
            />
            <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>0 = Complimentary COD service</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: SHIPPING PROVIDERS MATRIX */}
      <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "19px", margin: 0, color: "#0d4428" }}>
              Integrated Shipping Providers & Aggregators
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
              Genuine API connection statuses. Only verified merchant credentials show <code>CONNECTED</code>.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {providersList.map((p) => {
            const isTesting = testingId === p.id;
            const testRes = testResults[p.id];

            return (
              <div
                key={p.id}
                style={{
                  border: `1px solid ${p.connected ? "#86efac" : "var(--border-subtle)"}`,
                  background: p.connected ? "#f8fdfa" : "#fafafa",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: p.connected ? "0 2px 8px rgba(16, 185, 129, 0.08)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "14.5px", color: "#111827" }}>{p.name}</strong>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {p.description}
                      </div>
                    </div>

                    {/* STATUS BADGE */}
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "0.5px",
                        background: p.connected ? "#dcfce7" : "#f3f4f6",
                        color: p.connected ? "#15803d" : "#6b7280",
                        border: `1px solid ${p.connected ? "#bbf7d0" : "#e5e7eb"}`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: p.connected ? "#22c55e" : "#9ca3af",
                        }}
                      />
                      {p.connected ? "CONNECTED" : "NOT CONNECTED"}
                    </span>
                  </div>

                  {/* LAST TEST / ERROR */}
                  {testRes && (
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: testRes.success ? "#15803d" : "#b91c1c",
                        background: testRes.success ? "#f0fdf4" : "#fef2f2",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        marginTop: "8px",
                      }}
                    >
                      {testRes.success ? "✓ " : "✕ "}
                      {testRes.message}
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider({ ...p });
                      setIsConfigModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: "700",
                      borderRadius: "4px",
                      background: "#0d4428",
                      color: "#f5d77f",
                      border: "1px solid #c59b27",
                      cursor: "pointer",
                    }}
                  >
                    Configure
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestConnection(p.id)}
                    disabled={isTesting}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: "700",
                      borderRadius: "4px",
                      background: "#f0fdf4",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                      cursor: isTesting ? "wait" : "pointer",
                    }}
                  >
                    {isTesting ? "Testing..." : "Test Link"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: WAREHOUSE DISPATCH LOCATION */}
      <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "16px", margin: 0, color: "#0d4428" }}>
              Pickup &amp; Origin Warehouse Location
            </h3>
            <button
              type="button"
              onClick={handleSaveGlobalSettings}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: "6px 16px", fontSize: "11px", fontWeight: "700" }}
            >
              {saving ? "SAVING..." : "SAVE WAREHOUSE"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Warehouse / Contact Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vijay Singh / PQN Central Hub"
                value={engineSettings.pickupLocation?.name || ""}
                onChange={(e) =>
                  setEngineSettings({
                    ...engineSettings,
                    pickupLocation: { ...engineSettings.pickupLocation, name: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>PIN Code (Origin) *</label>
              <input
                type="text"
                maxLength={6}
                className="form-input"
                placeholder="e.g. 110059 or 395002"
                value={engineSettings.pickupLocation?.pincode || ""}
                onChange={(e) => handleOriginPincodeChange(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Address Line *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Z 147 A DBLOCK 2 FIR ARYA SAMAJ ROAD UTTAM NAGAR"
                value={engineSettings.pickupLocation?.addressLine1 || ""}
                onChange={(e) =>
                  setEngineSettings({
                    ...engineSettings,
                    pickupLocation: { ...engineSettings.pickupLocation, addressLine1: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>City *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. New Delhi"
                value={engineSettings.pickupLocation?.city || ""}
                onChange={(e) =>
                  setEngineSettings({
                    ...engineSettings,
                    pickupLocation: { ...engineSettings.pickupLocation, city: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>State *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Delhi"
                value={engineSettings.pickupLocation?.state || ""}
                onChange={(e) =>
                  setEngineSettings({
                    ...engineSettings,
                    pickupLocation: { ...engineSettings.pickupLocation, state: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Dispatch Contact Phone *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +91 9999999999"
                value={engineSettings.pickupLocation?.phone || ""}
                onChange={(e) =>
                  setEngineSettings({
                    ...engineSettings,
                    pickupLocation: { ...engineSettings.pickupLocation, phone: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Dispatch Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. shipping@pqnpartyqueen.com"
                value={engineSettings.pickupLocation?.email || ""}
                onChange={(e) =>
                  setEngineSettings({
                    ...engineSettings,
                    pickupLocation: { ...engineSettings.pickupLocation, email: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f0f0f0" }}>
            <button
              type="button"
              onClick={handleSaveGlobalSettings}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: "9px 24px", fontSize: "12px", fontWeight: "700" }}
            >
              {saving ? "SAVING WAREHOUSE..." : "SAVE ORIGIN WAREHOUSE LOCATION"}
            </button>
          </div>
        </div>

      {/* SECTION 4: LIVE RATE CALCULATOR SANDBOX */}
      <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "24px" }}>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "16px", margin: "0 0 10px", color: "#1e293b" }}>
          Live Rate Shopping & PIN Code Serviceability Sandbox
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#64748b" }}>
          Simulate a real-time rate request across all enabled shipping providers to verify live API connections.
        </p>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ width: "140px" }}>
            <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Destination PIN</label>
            <input
              type="text"
              className="form-input"
              value={testPincode}
              onChange={(e) => setTestPincode(e.target.value)}
            />
          </div>

          <div style={{ width: "120px" }}>
            <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={testWeight}
              onChange={(e) => setTestWeight(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", height: "42px" }}>
            <input
              type="checkbox"
              id="testCod"
              checked={testIsCod}
              onChange={(e) => setTestIsCod(e.target.checked)}
            />
            <label htmlFor="testCod" style={{ fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              Cash on Delivery (COD)
            </label>
          </div>

          <button
            type="button"
            onClick={handleCalculateLiveRates}
            disabled={calculatingRates}
            style={{
              padding: "10px 20px",
              background: "#0d4428",
              color: "#f5d77f",
              border: "1px solid #c59b27",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {calculatingRates ? "Querying Providers..." : "Fetch Live Rate Quotes"}
          </button>
        </div>

        {/* RATE QUOTES TABLE */}
        {rateQuotes && (
          <div style={{ marginTop: "18px" }}>
            {rateQuotes.length === 0 ? (
              <div style={{ padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", color: "#64748b" }}>
                No active carrier quotes returned. Ensure at least one shipping provider is configured with valid credentials and test connection.
              </div>
            ) : (
              <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 14px" }}>Provider</th>
                      <th style={{ padding: "10px 14px" }}>Courier Partner</th>
                      <th style={{ padding: "10px 14px" }}>Service Mode</th>
                      <th style={{ padding: "10px 14px" }}>Freight (₹)</th>
                      <th style={{ padding: "10px 14px" }}>COD Charge</th>
                      <th style={{ padding: "10px 14px" }}>Total (₹)</th>
                      <th style={{ padding: "10px 14px" }}>Est. Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateQuotes.map((q, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px", fontWeight: "700" }}>{q.providerName}</td>
                        <td style={{ padding: "10px 14px" }}>{q.courierName}</td>
                        <td style={{ padding: "10px 14px", textTransform: "uppercase" }}>{q.serviceType}</td>
                        <td style={{ padding: "10px 14px" }}>₹{q.rate}</td>
                        <td style={{ padding: "10px 14px" }}>₹{q.codCharge}</td>
                        <td style={{ padding: "10px 14px", fontWeight: "700", color: "#0d4428" }}>₹{q.totalCharge}</td>
                        <td style={{ padding: "10px 14px" }}>{q.estimatedDeliveryDays} Days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROVIDER CREDENTIAL CONFIGURATION MODAL */}
      {isConfigModalOpen && selectedProvider && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              maxWidth: "540px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0, color: "#0d4428" }}>
                Configure {selectedProvider.name} Credentials
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProviderModal} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="enableProvider"
                  checked={selectedProvider.enabled}
                  onChange={(e) => setSelectedProvider({ ...selectedProvider, enabled: e.target.checked })}
                />
                <label htmlFor="enableProvider" style={{ fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  Enable {selectedProvider.name} in Rate Engine
                </label>
              </div>

              {selectedProvider.id === "shiprocket" && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                      Shiprocket Account Email
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={selectedProvider.credentials.email || ""}
                      onChange={(e) =>
                        setSelectedProvider({
                          ...selectedProvider,
                          credentials: { ...selectedProvider.credentials, email: e.target.value },
                        })
                      }
                      placeholder="merchant@example.com"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                      Shiprocket Account Password
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={selectedProvider.credentials.password || ""}
                      onChange={(e) =>
                        setSelectedProvider({
                          ...selectedProvider,
                          credentials: { ...selectedProvider.credentials, password: e.target.value },
                        })
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {selectedProvider.id === "nimbuspost" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    NimbusPost API Key
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={selectedProvider.credentials.apiKey || ""}
                    onChange={(e) =>
                      setSelectedProvider({
                        ...selectedProvider,
                        credentials: { ...selectedProvider.credentials, apiKey: e.target.value },
                      })
                    }
                    placeholder="Enter API Key from NimbusPost panel"
                  />
                </div>
              )}

              {selectedProvider.id === "ithink" && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                      iThink Logistics Access Token
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedProvider.credentials.accessKey || ""}
                      onChange={(e) =>
                        setSelectedProvider({
                          ...selectedProvider,
                          credentials: { ...selectedProvider.credentials, accessKey: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                      iThink Secret Key
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={selectedProvider.credentials.apiSecret || ""}
                      onChange={(e) =>
                        setSelectedProvider({
                          ...selectedProvider,
                          credentials: { ...selectedProvider.credentials, apiSecret: e.target.value },
                        })
                      }
                    />
                  </div>
                </>
              )}

              {selectedProvider.id === "shipmozo" && (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Shipmozo API Key
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={selectedProvider.credentials.apiKey || ""}
                    onChange={(e) =>
                      setSelectedProvider({
                        ...selectedProvider,
                        credentials: { ...selectedProvider.credentials, apiKey: e.target.value },
                      })
                    }
                  />
                </div>
              )}

              {(selectedProvider.id === "delhivery" ||
                selectedProvider.id === "bluedart" ||
                selectedProvider.id === "dtdc" ||
                selectedProvider.id === "xpressbees") && (
                <>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                      API Token / Access Key
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={selectedProvider.credentials.apiKey || ""}
                      onChange={(e) =>
                        setSelectedProvider({
                          ...selectedProvider,
                          credentials: { ...selectedProvider.credentials, apiKey: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                      Client Code / Merchant ID
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedProvider.credentials.merchantId || ""}
                      onChange={(e) =>
                        setSelectedProvider({
                          ...selectedProvider,
                          credentials: { ...selectedProvider.credentials, merchantId: e.target.value },
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Pickup Location Nickname
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedProvider.credentials.pickupLocationName || ""}
                  onChange={(e) =>
                    setSelectedProvider({
                      ...selectedProvider,
                      credentials: { ...selectedProvider.credentials, pickupLocationName: e.target.value },
                    })
                  }
                  placeholder="e.g. Primary Warehouse / New Delhi Hub"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: "8px 24px", fontSize: "12px", fontWeight: "800", letterSpacing: "0.5px" }}
                >
                  {saving ? "SAVING..." : "SAVE CREDENTIALS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
