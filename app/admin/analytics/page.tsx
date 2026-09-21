"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { BarChartIcon, TagIcon, PackageIcon, UserIcon, SparklesIcon } from "@/app/components/Icons";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d"); // 7d, 30d, 90d, 1y, all

  async function loadAnalytics(selectedRange = range) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load analytics data.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics(range);
  }, [range]);

  if (loading && !data) {
    return (
      <AdminLayout title="Analytics & Financial Reports">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Computing commerce analytics...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Analytics & Financial Reports">
        <p style={{ color: "#991b1b" }}>{error || "Failed to load reports."}</p>
        <button type="button" onClick={() => loadAnalytics(range)} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  const { metrics, monthlySales, topProducts, trafficSources, statusBreakdown } = data;
  const maxMonthlyRevenue = Math.max(...monthlySales.map((m: any) => m.revenue), 1);

  return (
    <AdminLayout
      title="Analytics & Financial Intelligence"
      actions={
        <div style={{ display: "flex", gap: "6px", background: "#fff", padding: "3px", borderRadius: "6px", border: "1px solid var(--border-medium)" }}>
          {[
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "1y", label: "1 Year" },
            { id: "all", label: "All Time" },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                background: range === r.id ? "#0d4428" : "transparent",
                color: range === r.id ? "#f5d77f" : "var(--color-text-main)",
                transition: "all 0.15s ease",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {/* 4 TOP FINANCIAL METRIC TILES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "28px" }}>
        {/* Cumulative Period Sales */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "22px", boxShadow: "var(--shadow-xs)" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Gross Sales ({range.toUpperCase()})
          </span>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0d4428", margin: "8px 0" }}>
            ₹{Number(metrics.grossSales).toLocaleString("en-IN")}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            From {metrics.validOrdersCount} confirmed orders
          </span>
        </div>

        {/* Daily Revenue (Today) */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "22px", boxShadow: "var(--shadow-xs)" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Today's Daily Revenue
          </span>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#c59b27", margin: "8px 0" }}>
            ₹{Number(metrics.dailyRevenue).toLocaleString("en-IN")}
          </div>
          <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>
            Live daily checkout pulse
          </span>
        </div>

        {/* Average Order Value */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "22px", boxShadow: "var(--shadow-xs)" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Average Order Value (AOV)
          </span>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--color-noir)", margin: "8px 0" }}>
            ₹{Number(metrics.avgOrderValue).toLocaleString("en-IN")}
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            High-ticket couture basket
          </span>
        </div>

        {/* Active Orders & Visitors */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "22px", boxShadow: "var(--shadow-xs)" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
            Active Orders / Visitors
          </span>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#15803d", margin: "8px 0" }}>
            {metrics.activeOrdersCount} Active
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {metrics.totalVisitors.toLocaleString()} Storefront visits ({metrics.conversionRate} conv.)
          </span>
        </div>
      </div>

      {/* SALES TREND CHART & TOP PRODUCTS */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "28px", marginBottom: "32px" }}>
        {/* Sales Trend Bar Chart */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0 }}>Sales Trend Performance</h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Revenue distribution over selected timeframe</span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", background: "rgba(13,68,40,0.1)", padding: "2px 8px", borderRadius: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>
              INR (₹)
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "220px", padding: "10px 0 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            {monthlySales.map((m: any, idx: number) => {
              const heightPercent = Math.max(14, Math.round((m.revenue / maxMonthlyRevenue) * 100));
              return (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-noir)", marginBottom: "6px" }}>
                    ₹{m.revenue > 0 ? (m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(1)}k` : m.revenue) : "0"}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "48px",
                      height: `${heightPercent}%`,
                      background: m.revenue > 0 ? "linear-gradient(180deg, #c59b27 0%, #0d4428 100%)" : "#e5ede8",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "8px", whiteSpace: "nowrap" }}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Bestselling Ensembles */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: "0 0 4px" }}>
            Bestselling Ensembles
          </h2>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
            Top revenue generating designs
          </span>

          {topProducts.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No purchase data recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {topProducts.map((prod: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--bg-main)",
                    borderRadius: "6px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-noir)" }}>
                      {i + 1}. {prod.name}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {prod.units} units sold
                    </span>
                  </div>
                  <strong style={{ fontSize: "14px", color: "#0d4428" }}>
                    ₹{Number(prod.revenue).toLocaleString("en-IN")}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2-COLUMN SECTION: TRAFFIC SOURCES & INVENTORY VALUATION */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "28px" }}>
        {/* Traffic Sources Acquisition */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px" }}>
            Traffic Acquisition Sources
          </h2>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
            Visitor discovery channels and marketing conversion
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {trafficSources.map((source: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <strong style={{ color: "#1c1917" }}>{source.channel}</strong>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {source.visitors.toLocaleString()} visitors ({source.share})
                  </span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "#f3f4f6", borderRadius: "10px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: source.share,
                      height: "100%",
                      background: source.color,
                      borderRadius: "10px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory & Fulfillment Breakdown */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px" }}>
            Atelier Inventory Valuation
          </h2>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
            Retail stock holdings & fulfillment health
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px 16px", background: "#f0f7f3", borderRadius: "6px", border: "1px solid #cce2d3" }}>
              <span style={{ fontSize: "11px", color: "#4a6350", textTransform: "uppercase", fontWeight: "700" }}>Total Retail Stock Value</span>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0d4428", margin: "4px 0" }}>
                ₹{Number(metrics.inventoryRetailValue).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", color: "#4a6350" }}>Across {metrics.totalStockCount} units ready for immediate dispatch</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "12px", background: "#fafaf9", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Fulfillment Rate</span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#15803d" }}>
                  {metrics.totalOrdersCount > 0
                    ? `${Math.round((metrics.validOrdersCount / metrics.totalOrdersCount) * 100)}%`
                    : "100%"}
                </div>
              </div>
              <div style={{ padding: "12px", background: "#fafaf9", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>Active Patrons</span>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#0d4428" }}>
                  {metrics.customersCount} Registered
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
