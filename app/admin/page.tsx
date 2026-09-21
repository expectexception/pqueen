"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import {
  PackageIcon,
  PlusIcon,
  TagIcon,
  UserIcon,
  TruckIcon,
  CheckIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@/app/components/Icons";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load statistics.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      setUpdatingId(orderId);
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (res.ok) {
        await loadStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Executive Overview">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Loading Executive Dashboard...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Executive Overview">
        <div style={{ padding: "40px 20px" }}>
          <p style={{ color: "#991b1b" }}>{error || "Unable to load dashboard."}</p>
          <button type="button" onClick={loadStats} className="btn-primary" style={{ marginTop: "12px" }}>
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { stats, recentOrders, lowStockVariants } = data;

  return (
    <AdminLayout
      title="Executive Overview"
      actions={
        <button
          type="button"
          onClick={loadStats}
          style={{
            padding: "8px 14px",
            borderRadius: "4px",
            background: "#fff",
            border: "1px solid var(--border-medium)",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          ↻ Refresh
        </button>
      }
    >
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
                ATELIER MANAGEMENT
              </span>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", margin: "4px 0" }}>
                Executive Overview
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
                Real-time commerce metrics, order fulfillment pipeline, and inventory status.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={loadStats}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  background: "#fff",
                  border: "1px solid var(--border-medium)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ↻ Refresh
              </button>
              <Link
                href="/admin/products/new"
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "12px" }}
              >
                <PlusIcon size={14} /> New Product
              </Link>
            </div>
          </div>

          {/* 4 KPI METRIC CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
            {/* Card 1: Revenue */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Total Net Revenue
              </span>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--brand-rose)", margin: "8px 0" }}>
                ₹{Number(stats.totalRevenue).toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Avg Order Value: <strong>₹{stats.avgOrderValue.toLocaleString("en-IN")}</strong>
              </span>
            </div>

            {/* Card 2: Orders */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Total Orders Placed
              </span>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-noir)", margin: "8px 0" }}>
                {stats.totalOrders}
              </div>
              <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>
                {stats.statusCounts.pending} Pending Fulfillment
              </span>
            </div>

            {/* Card 3: Products */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Catalog Ensembles
              </span>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-noir)", margin: "8px 0" }}>
                {stats.totalProducts}
              </div>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {stats.activeProductsCount} Active • {stats.draftProductsCount} Draft
              </span>
            </div>

            {/* Card 4: Customers */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
                Active Customers
              </span>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-noir)", margin: "8px 0" }}>
                {stats.totalCustomers}
              </div>
              <Link href="/admin/customers" style={{ fontSize: "12px", color: "var(--brand-rose)", textDecoration: "underline", fontWeight: "600" }}>
                View CRM Directory →
              </Link>
            </div>
          </div>

          {/* STATUS FUNNEL BAR */}
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "20px 24px", marginBottom: "32px", boxShadow: "var(--shadow-xs)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", color: "var(--color-noir)", textTransform: "uppercase", display: "block", marginBottom: "14px" }}>
              Order Pipeline by Status
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
              {Object.entries(stats.statusCounts).map(([st, count]: [string, any]) => (
                <Link
                  key={st}
                  href={`/admin/orders`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "12px 8px",
                    borderRadius: "6px",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-subtle)",
                    textDecoration: "none",
                  }}
                >
                  <strong style={{ fontSize: "18px", color: "var(--color-noir)" }}>{count}</strong>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>
                    {st}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* TWO COLUMN SECTION: RECENT ORDERS & LOW STOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "28px" }}>
            {/* LEFT: RECENT ORDERS */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0 }}>Recent Orders</h2>
                <Link href="/admin/orders" style={{ fontSize: "12px", color: "var(--brand-rose)", fontWeight: "600", textDecoration: "underline" }}>
                  View All Orders →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background: "var(--bg-main)",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: "700", fontSize: "14px", color: "var(--color-noir)" }}>
                        {order.orderNumber}
                      </Link>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        {order.customer?.name || order.shippingName} • ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "5px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-medium)",
                          background: "#fff",
                        }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="RETURNED">RETURNED</option>
                      </select>
                      <Link href={`/admin/orders/${order.id}`} style={{ fontSize: "12px", color: "var(--brand-rose)" }}>
                        →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: LOW STOCK & QUICK LINKS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Low Stock Card */}
              <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    ⚠️ Low Inventory Alerts
                  </h2>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#b42318" }}>
                    &le; 5 units
                  </span>
                </div>

                {lowStockVariants.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>All inventory levels are healthy.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {lowStockVariants.map((v: any) => (
                      <div
                        key={v.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          padding: "8px 12px",
                          background: "#fff1f2",
                          borderRadius: "4px",
                          border: "1px solid #fecdd3",
                        }}
                      >
                        <div>
                          <strong>{v.productName}</strong>
                          <div style={{ fontSize: "11px", color: "#9f1239" }}>
                            Size: {v.size} {v.color ? `• Color: ${v.color}` : ""}
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#9f1239" }}>
                          {v.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Card */}
              <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Atelier Quick Controls
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <Link
                    href="/admin/categories"
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-main)",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                      textDecoration: "none",
                      color: "var(--color-noir)",
                    }}
                  >
                    🏷️ Categories
                  </Link>
                  <Link
                    href="/admin/customers"
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-main)",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                      textDecoration: "none",
                      color: "var(--color-noir)",
                    }}
                  >
                    👥 Customers
                  </Link>
                  <Link
                    href="/admin/settings"
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-main)",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                      textDecoration: "none",
                      color: "var(--color-noir)",
                    }}
                  >
                    ⚙️ Store Settings
                  </Link>
                  <Link
                    href="/admin/products/new"
                    style={{
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-main)",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                      textDecoration: "none",
                      color: "var(--color-noir)",
                    }}
                  >
                    ✨ Add Ensemble
                  </Link>
                </div>
              </div>
            </div>
          </div>
    </AdminLayout>
  );
}
