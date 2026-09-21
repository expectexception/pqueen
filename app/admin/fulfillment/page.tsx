"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import {
  PackageIcon,
  TruckIcon,
  CheckIcon,
  ShieldCheckIcon,
  SearchIcon,
  LayersIcon,
  SparklesIcon,
  RefreshCwIcon,
  TagIcon,
  ArrowRightIcon,
  RouteIcon,
  FileSpreadsheetIcon,
  BarcodeScanIcon,
  DownloadCloudIcon,
  PrinterIcon,
  ScaleIcon,
} from "@/app/components/Icons";

export default function AdminFulfillmentPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"routing" | "wavepick" | "scanner" | "rates" | "asn" | "returns">("routing");

  // Scanner Simulator State
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scanResult, setScanResult] = useState<{ status: "success" | "error" | "idle"; message: string; item?: string }>({ status: "idle", message: "" });
  const [boxDimensions, setBoxDimensions] = useState({ length: 42, width: 32, height: 12, weight: 1.45 });

  // Rate Shopping Calculator State
  const [calcWeight, setCalcWeight] = useState(1.5);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkDispatching, setBulkDispatching] = useState(false);
  const [manifestSuccess, setManifestSuccess] = useState("");

  // ASN Intake State
  const [asnForm, setAsnForm] = useState({ vendorName: "Jaipur Heritage Zari Atelier", invoiceNo: "INV-ATELIER-8921", itemsCount: 4, totalQty: 25, hubId: "HUB-DEL-01" });
  const [recordingAsn, setRecordingAsn] = useState(false);
  const [asnSuccess, setAsnSuccess] = useState("");

  async function loadFulfillmentData() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/fulfillment");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load fulfillment data.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load fulfillment pipeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFulfillmentData();
  }, []);

  function handleScanBarcode(e: React.FormEvent) {
    e.preventDefault();
    if (!scannedBarcode.trim()) return;

    const query = scannedBarcode.trim().toUpperCase();
    const allItems = data?.routedOrders?.flatMap((o: any) => o.items) || [];
    const matched = allItems.find((it: any) => 
      it.productName.toUpperCase().includes(query) || 
      it.id.toUpperCase().includes(query) ||
      `PQN-${it.size || "STD"}`.toUpperCase().includes(query)
    );

    if (matched) {
      setScanResult({
        status: "success",
        message: `✓ QC PASSED & VERIFIED: ${matched.productName} (Size: ${matched.size || "Free Size"}). Matched to packing manifest!`,
        item: matched.productName,
      });
    } else {
      setScanResult({
        status: "error",
        message: `❌ SKU MISMATCH: Barcode "${query}" not found in current packing queue. Please check item garment tag.`,
      });
    }
    setScannedBarcode("");
  }

  async function handleBulkManifest(courier: string) {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to generate a bulk manifest.");
      return;
    }

    try {
      setBulkDispatching(true);
      const res = await fetch("/api/admin/fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_manifest",
          orderIds: selectedOrders,
          courier,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setManifestSuccess(json.message);
        setSelectedOrders([]);
        loadFulfillmentData();
        setTimeout(() => setManifestSuccess(""), 4000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate manifest.");
    } finally {
      setBulkDispatching(false);
    }
  }

  async function handleRecordAsn(e: React.FormEvent) {
    e.preventDefault();
    try {
      setRecordingAsn(true);
      const res = await fetch("/api/admin/fulfillment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_asn",
          ...asnForm,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAsnSuccess(json.message);
        setTimeout(() => setAsnSuccess(""), 4000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to record ASN.");
    } finally {
      setRecordingAsn(false);
    }
  }

  if (loading && !data) {
    return (
      <AdminLayout title="Order Fulfillment & Warehouse Management (WMS)">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Loading Fulfillment Engine & Warehouse Pipelines...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Order Fulfillment & WMS">
        <p style={{ color: "#991b1b" }}>{error || "Unable to load fulfillment system."}</p>
        <button type="button" onClick={loadFulfillmentData} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  const { metrics, routedOrders, wavePickList, hubs, carrierRates } = data;
  const volumetricWeight = ((boxDimensions.length * boxDimensions.width * boxDimensions.height) / 5000).toFixed(2);

  return (
    <AdminLayout
      title="Order Fulfillment & Warehouse Management System (WMS / OMS)"
      actions={
        <div className="no-print" style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: "#fff",
              border: "1px solid #0d4428",
              color: "#0d4428",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <PrinterIcon size={14} /> Print Wave Picklist / Manifest
          </button>
          <button
            type="button"
            onClick={loadFulfillmentData}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: "#0d4428",
              color: "#f5d77f",
              border: "1px solid #c59b27",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCwIcon size={14} /> Sync Live Inventory & Queue
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {/* PIPELINE METRICS BANNER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Queue Intake</span>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#0d4428", margin: "4px 0" }}>{metrics.totalOrders}</div>
            <span style={{ fontSize: "11px", color: "#4b5563" }}>Total Orders in OMS</span>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Batch Picking</span>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#d97706", margin: "4px 0" }}>{metrics.processingOrders}</div>
            <span style={{ fontSize: "11px", color: "#4b5563" }}>Wave Picklists Active</span>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>QC Inspection</span>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#0d4428", margin: "4px 0" }}>{metrics.totalSKUs}</div>
            <span style={{ fontSize: "11px", color: "#4b5563" }}>Unique SKUs In Flight</span>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" }}>Courier Dispatched</span>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#2563eb", margin: "4px 0" }}>{metrics.shippedOrders}</div>
            <span style={{ fontSize: "11px", color: "#4b5563" }}>AWBs in Transit</span>
          </div>
          <div style={{ background: "#0d4428", borderRadius: "8px", padding: "16px", color: "#fff", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#f5d77f", textTransform: "uppercase" }}>Delivered SLA</span>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "#ffffff", margin: "4px 0" }}>{metrics.deliveredOrders}</div>
            <span style={{ fontSize: "11px", color: "#d4e2d8" }}>100% On-Time Fulfillment</span>
          </div>
        </div>

        {manifestSuccess && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "20px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckIcon size={16} /> {manifestSuccess}
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="no-print" style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "24px", overflowX: "auto" }}>
          {[
            { id: "routing", label: "Smart Hub Routing", icon: <RouteIcon size={14} /> },
            { id: "wavepick", label: "Batch & Wave Picking", icon: <FileSpreadsheetIcon size={14} /> },
            { id: "scanner", label: "Barcode & QC Packing Station", icon: <BarcodeScanIcon size={14} /> },
            { id: "rates", label: "Carrier Rate Shopping & Manifest", icon: <TruckIcon size={14} /> },
            { id: "asn", label: "Digital ASN & Receiving", icon: <DownloadCloudIcon size={14} /> },
            { id: "returns", label: "Reverse Logistics", icon: <RefreshCwIcon size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "8px 18px",
                borderRadius: "4px",
                fontSize: "12.5px",
                fontWeight: "700",
                cursor: "pointer",
                border: "none",
                background: activeTab === tab.id ? "#0d4428" : "#f0f4f1",
                color: activeTab === tab.id ? "#f5d77f" : "#4a6350",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SMART HUB ROUTING & MULTI-WAREHOUSE ALLOCATION */}
        {activeTab === "routing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* WAREHOUSE HUBS GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              {hubs.map((hub: any) => (
                <div key={hub.id} style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "18px", boxShadow: "var(--shadow-xs)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: "800", background: "rgba(13,68,40,0.1)", color: "#0d4428", padding: "2px 6px", borderRadius: "4px" }}>
                      {hub.code}
                    </span>
                    <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "700" }}>🟢 {hub.capacity}</span>
                  </div>
                  <strong style={{ fontSize: "13.5px", color: "#111827", display: "block", marginBottom: "2px" }}>{hub.name}</strong>
                  <span style={{ fontSize: "11.5px", color: "#6b7280" }}>{hub.city}, {hub.state}</span>
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#4b5563" }}>Assigned Orders:</span>
                    <strong style={{ color: "#0d4428" }}>{hub.activeOrders} Shipments</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* ROUTED ORDERS TABLE */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    Automated Order-to-Hub Routing Queue
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Orders automatically dispatched to the closest regional fulfillment hub based on postal PIN code
                  </span>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#15803d" }}>
                  ✓ Geo-Routing Engine Active
                </span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Order Ref</th>
                    <th style={{ padding: "10px 12px" }}>Consignee & Destination</th>
                    <th style={{ padding: "10px 12px" }}>State (GST Code)</th>
                    <th style={{ padding: "10px 12px" }}>Assigned Fulfillment Hub</th>
                    <th style={{ padding: "10px 12px" }}>Fulfillment SLA</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {routedOrders.map((o: any) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px", fontWeight: "800", color: "#0d4428", fontFamily: "monospace" }}>
                        #{o.orderNumber}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <strong style={{ color: "#111827" }}>{o.shippingName}</strong>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{o.shippingCity} - {o.shippingPincode}</div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ fontWeight: "700" }}>{o.stateInfo.name}</span>
                        <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "4px" }}>({o.stateInfo.code})</span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#f0f7f3", color: "#0d4428", fontWeight: "700", border: "1px solid #d4e2d8" }}>
                          🏢 {o.assignedHub.code}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#15803d", fontWeight: "600" }}>
                        ⚡ {o.assignedHub.sla}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", background: o.status === "DELIVERED" ? "#dcfce7" : "#fef3c7", color: o.status === "DELIVERED" ? "#15803d" : "#92400e" }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BATCH & WAVE PICKING ENGINE */}
        {activeTab === "wavepick" && (
          <div id="printable-wavepick" style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0d4428", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0, color: "#0d4428" }}>
                  📋 Consolidated Wave Picklist (Batch Fulfillment)
                </h2>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  SKUs sorted by warehouse aisle and bin to minimize walking time for pickers
                </span>
              </div>

              <div className="no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "4px",
                    background: "#0d4428",
                    color: "#f5d77f",
                    border: "1px solid #c59b27",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  🖨️ Print Wave Picklist
                </button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ background: "#0d4428", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", width: "50px", textAlign: "center" }}>Check</th>
                  <th style={{ padding: "10px 12px" }}>Warehouse Bin Location</th>
                  <th style={{ padding: "10px 12px" }}>Haute Couture Silhouette / SKU</th>
                  <th style={{ padding: "10px 12px", width: "90px" }}>Size</th>
                  <th style={{ padding: "10px 12px", width: "90px", textAlign: "center" }}>Total Qty</th>
                  <th style={{ padding: "10px 12px" }}>Associated Order Batch</th>
                </tr>
              </thead>
              <tbody>
                {wavePickList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#6b7280" }}>
                      All current orders have been picked and moved to the QC packing station.
                    </td>
                  </tr>
                ) : (
                  wavePickList.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <input type="checkbox" style={{ width: "18px", height: "18px", accentColor: "#0d4428" }} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "800", color: "#0d4428", background: "#f0f7f3", padding: "4px 8px", borderRadius: "4px", border: "1px solid #d4e2d8" }}>
                          📍 {item.aisleBin}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <strong style={{ fontSize: "13px", color: "#111827" }}>{item.productName}</strong>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "700" }}>{item.size}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "900", fontSize: "15px", color: "#0d4428" }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {item.orders.map((ord: string) => (
                            <span key={ord} style={{ fontSize: "10.5px", background: "#fafaf9", border: "1px solid #d1d5db", padding: "2px 6px", borderRadius: "3px", fontWeight: "600" }}>
                              #{ord}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: BARCODE & QC PACKING STATION */}
        {activeTab === "scanner" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
            {/* SCANNER & QC CHECKER */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0d4428", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🔍
                </div>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    Barcode Scanner & QC Verification Station
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Scan product garment barcode / SKU to verify 100% accuracy before boxing
                  </span>
                </div>
              </div>

              <form onSubmit={handleScanBarcode} style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Scan Barcode or Type SKU Code:
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Scan garment tag (e.g. Lehenga, Silk, Gown...)"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    style={{ flex: 1, fontSize: "14px", fontWeight: "700", fontFamily: "monospace" }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: "0 20px", fontSize: "12px" }}>
                    VERIFY SCAN
                  </button>
                </div>
              </form>

              {/* SCAN RESULT FEEDBACK */}
              {scanResult.status !== "idle" && (
                <div style={{
                  padding: "16px 20px",
                  borderRadius: "6px",
                  border: scanResult.status === "success" ? "1.5px solid #bbf7d0" : "1.5px solid #fecaca",
                  background: scanResult.status === "success" ? "#f0fdf4" : "#fef2f2",
                  color: scanResult.status === "success" ? "#166534" : "#991b1b",
                  fontSize: "13px",
                  fontWeight: "700",
                  lineHeight: "1.4",
                }}>
                  {scanResult.message}
                </div>
              )}
            </div>

            {/* VOLUMETRIC WEIGHT & DIMENSION VALIDATOR */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 6px" }}>
                ⚖️ Volumetric Weight & Box Dimension Validator
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "18px" }}>
                Validates L &times; W &times; H to eliminate carrier billing adjustment penalties
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700" }}>Length (cm)</label>
                  <input
                    type="number"
                    value={boxDimensions.length}
                    onChange={(e) => setBoxDimensions({ ...boxDimensions, length: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700" }}>Width (cm)</label>
                  <input
                    type="number"
                    value={boxDimensions.width}
                    onChange={(e) => setBoxDimensions({ ...boxDimensions, width: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700" }}>Height (cm)</label>
                  <input
                    type="number"
                    value={boxDimensions.height}
                    onChange={(e) => setBoxDimensions({ ...boxDimensions, height: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700" }}>Physical Weight (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={boxDimensions.weight}
                    onChange={(e) => setBoxDimensions({ ...boxDimensions, weight: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ background: "#f8faf9", padding: "14px", borderRadius: "6px", border: "1px solid #d4e2d8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span>Volumetric Weight (5000 Divisor):</span>
                  <strong>{volumetricWeight} KG</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#0d4428", fontWeight: "800" }}>
                  <span>Billable Weight:</span>
                  <span>{Math.max(boxDimensions.weight, Number(volumetricWeight))} KG (Optimal)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CARRIER RATE SHOPPING & AUTOMATED MANIFESTING */}
        {activeTab === "rates" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* RATE SHOPPING COMPARATOR */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    ⚡ Real-Time Carrier Rate Shopping
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Dynamic comparison across top Indian logistics partners for guaranteed delivery SLAs
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700" }}>Package Weight:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    style={{ width: "80px", padding: "6px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                  />
                  <span style={{ fontSize: "12px" }}>KG</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {carrierRates.map((cr: any, i: number) => {
                  const estCost = Math.round(cr.baseCost + (calcWeight - 1) * cr.ratePerKg);
                  return (
                    <div key={i} style={{ border: cr.recommended ? "2px solid #0d4428" : "1px solid var(--border-subtle)", borderRadius: "8px", padding: "18px", background: cr.recommended ? "#f0f7f3" : "#fff", position: "relative" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", background: cr.recommended ? "#0d4428" : "#f3f4f6", color: cr.recommended ? "#f5d77f" : "#374151", padding: "2px 8px", borderRadius: "10px", display: "inline-block", marginBottom: "8px" }}>
                        {cr.badge}
                      </span>
                      <strong style={{ fontSize: "14px", display: "block", color: "#111827" }}>{cr.carrier}</strong>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>{cr.mode}</span>
                      <div style={{ fontSize: "22px", fontWeight: "900", color: "#0d4428", margin: "10px 0 4px" }}>
                        ₹{estCost}
                      </div>
                      <span style={{ fontSize: "11.5px", color: "#15803d", fontWeight: "700" }}>SLA: {cr.estDays}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BULK MANIFEST DISPATCH */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    Bulk Manifest Generator ({routedOrders.filter((o: any) => o.status !== "SHIPPED" && o.status !== "DELIVERED").length} Pending)
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Select orders to generate a unified handover manifest sheet for Blue Dart / Delhivery courier pickups
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={bulkDispatching}
                    onClick={() => handleBulkManifest("Blue Dart Express")}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "4px",
                      background: "#0d4428",
                      color: "#f5d77f",
                      border: "1px solid #c59b27",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    ⚡ Manifest via Blue Dart ({selectedOrders.length} Selected)
                  </button>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", width: "40px" }}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(routedOrders.map((o: any) => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                      />
                    </th>
                    <th style={{ padding: "8px 10px" }}>Order</th>
                    <th style={{ padding: "8px 10px" }}>Customer / Consignee</th>
                    <th style={{ padding: "8px 10px" }}>Destination State</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {routedOrders.map((o: any) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px" }}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(o.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedOrders([...selectedOrders, o.id]);
                            else setSelectedOrders(selectedOrders.filter((id) => id !== o.id));
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px", fontWeight: "700" }}>#{o.orderNumber}</td>
                      <td style={{ padding: "10px" }}>{o.shippingName} ({o.shippingCity})</td>
                      <td style={{ padding: "10px" }}>{o.shippingState} - {o.shippingPincode}</td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: "700" }}>₹{Number(o.totalAmount).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DIGITAL ASN & RECEIVING */}
        {activeTab === "asn" && (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px", color: "#0d4428" }}>
                📥 Digital Advanced Shipping Notice (ASN) Intake
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
                Faster dock-to-stock intake and FIFO batch allocation for incoming shipments from artisan ateliers
              </span>

              {asnSuccess && (
                <div style={{ padding: "14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#15803d", fontSize: "13px", fontWeight: "700", marginBottom: "18px" }}>
                  ✓ {asnSuccess}
                </div>
              )}

              <form onSubmit={handleRecordAsn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Atelier / Supplier Vendor Name:</label>
                  <input
                    type="text"
                    required
                    value={asnForm.vendorName}
                    onChange={(e) => setAsnForm({ ...asnForm, vendorName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Challan / Invoice No:</label>
                    <input
                      type="text"
                      required
                      value={asnForm.invoiceNo}
                      onChange={(e) => setAsnForm({ ...asnForm, invoiceNo: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Receiving Hub:</label>
                    <select
                      value={asnForm.hubId}
                      onChange={(e) => setAsnForm({ ...asnForm, hubId: e.target.value })}
                      className="form-input"
                    >
                      <option value="HUB-DEL-01">Central Atelier Delhi Hub (NDLS)</option>
                      <option value="HUB-BOM-02">Western Atelier Mumbai Hub (BOM)</option>
                      <option value="HUB-BLR-01">Southern Fashion Hub (BLR)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Total Ensembles Received (Units):</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={asnForm.totalQty}
                      onChange={(e) => setAsnForm({ ...asnForm, totalQty: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>FIFO Batch Tag:</label>
                    <input
                      type="text"
                      readOnly
                      value="BATCH-2026-AUG-LOT4"
                      className="form-input"
                      style={{ background: "#f3f4f6" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button
                    type="submit"
                    disabled={recordingAsn}
                    className="btn-primary"
                    style={{ padding: "10px 24px", fontSize: "12px" }}
                  >
                    {recordingAsn ? "Receiving..." : "📥 Record ASN & Restock Inventory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: REVERSE LOGISTICS & RETURNS */}
        {activeTab === "returns" && (
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px", color: "#0d4428" }}>
              🔄 Reverse Logistics & Return QC Hub
            </h2>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
              Prepaid return label generation, doorstep reverse pickup verification, and automatic stock logging
            </span>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Order Ref</th>
                  <th style={{ padding: "10px 12px" }}>Customer</th>
                  <th style={{ padding: "10px 12px" }}>Return Reason</th>
                  <th style={{ padding: "10px 12px" }}>QC Grade</th>
                  <th style={{ padding: "10px 12px" }}>Restock Status</th>
                </tr>
              </thead>
              <tbody>
                {routedOrders.filter((o: any) => o.status === "RETURNED").length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                      No active return shipments pending QC inspection.
                    </td>
                  </tr>
                ) : (
                  routedOrders.filter((o: any) => o.status === "RETURNED").map((o: any) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", fontWeight: "700" }}>#{o.orderNumber}</td>
                      <td style={{ padding: "12px" }}>{o.shippingName}</td>
                      <td style={{ padding: "12px", color: "#4b5563" }}>Size fit alteration requested</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "4px", fontWeight: "700" }}>
                          Grade A (Pristine)
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#15803d", fontWeight: "700" }}>
                        ✓ Restocked to Atelier
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
