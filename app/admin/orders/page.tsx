"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import OrderDocumentsModal from "@/app/components/OrderDocumentsModal";
import {
  SearchIcon,
  EyeIcon,
  ReceiptIcon,
  FileSpreadsheetIcon,
  TruckIcon,
  TrashIcon,
  RefreshCwIcon,
} from "@/app/components/Icons";
import { evaluateReturnEligibility } from "@/lib/return-policy";

type OrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  awbNumber?: string | null;
  courierName?: string | null;
  shippingStatus?: string | null;
  shippingError?: string | null;
  shippingLabelUrl?: string | null;
  ithinkOrderId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PREPAID" | "COD">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeDocOrder, setActiveDocOrder] = useState<Order | null>(null);
  const [docModalMode, setDocModalMode] = useState<"invoice" | "packingslip" | "shippinglabel" | "combined" | "refund" | "dispatch">("invoice");

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleDeleteOrder(orderId: string, orderNumber: string) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently remove Order #${orderNumber}? This will remove it from all records.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(orderId);
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete order.");
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert(err.message || "Could not remove order.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      setUpdatingId(orderId);
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status.");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message || "Could not update status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      RETURNED: 0,
      PREPAID: 0,
      COD: 0,
      prepaidRevenue: 0,
      codRevenue: 0,
    };
    orders.forEach((o) => {
      if (map[o.status] !== undefined) map[o.status]++;
      const isCod = (o.paymentMethod || "").toUpperCase() === "COD";
      if (isCod) {
        map.COD++;
        if (o.status !== "CANCELLED" && o.status !== "RETURNED") {
          map.codRevenue += Number(o.totalAmount);
        }
      } else {
        map.PREPAID++;
        if (o.status !== "CANCELLED" && o.status !== "RETURNED") {
          map.prepaidRevenue += Number(o.totalAmount);
        }
      }
    });
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

      const isCod = (o.paymentMethod || "").toUpperCase() === "COD";
      if (paymentFilter === "PREPAID" && isCod) return false;
      if (paymentFilter === "COD" && !isCod) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const numMatch = o.orderNumber.toLowerCase().includes(q);
        const nameMatch = (o.customer?.name || o.shippingName || "").toLowerCase().includes(q);
        const phoneMatch = (o.customer?.phone || o.shippingPhone || "").includes(q);
        const cityMatch = (o.shippingCity || "").toLowerCase().includes(q);
        const itemMatch = o.items.some((it) => it.productName.toLowerCase().includes(q));
        const paymentMatch = isCod ? "cod cash on delivery".includes(q) : "prepaid online razorpay".includes(q);

        return numMatch || nameMatch || phoneMatch || cityMatch || itemMatch || paymentMatch;
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, search]);

  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED")
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  }, [orders]);

  const [pushingOrderId, setPushingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  async function handleCancelOrder(orderId: string, orderNumber: string) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${orderNumber}? This will automatically transmit a cancellation request to iThink Logistics to cancel the AWB and log the wallet refund.`
    );
    if (!confirmed) return;

    try {
      setCancellingOrderId(orderId);
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: "Admin Portal Cancellation" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order.");
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED", shippingStatus: "CANCELLED" } : o))
      );
      alert(data.message || `✓ Order #${orderNumber} cancelled successfully.`);
    } catch (err: any) {
      alert(`✕ ${err.message || "Failed to cancel order."}`);
    } finally {
      setCancellingOrderId(null);
    }
  }

  async function handlePushOrderToIThink(orderId: string) {
    try {
      setPushingOrderId(orderId);
      const res = await fetch("/api/admin/shipping/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to push order to iThink Logistics.");
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                awbNumber: data.awbNumber,
                courierName: data.courierName,
                trackingUrl: data.trackingUrl,
                shippingLabelUrl: data.shippingLabelUrl,
                ithinkOrderId: data.ithinkOrderId,
                status: "SHIPPED",
              }
            : o
        )
      );
      alert(`✓ Order successfully pushed to iThink Logistics! Assigned AWB: ${data.awbNumber || "Generated"}`);
    } catch (err: any) {
      alert(`✕ ${err.message || "Failed to push order to iThink Logistics."}`);
    } finally {
      setPushingOrderId(null);
    }
  }

  function getStatusBadgeStyle(status: string) {
    switch (status) {
      case "DELIVERED":
        return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" };
      case "SHIPPED":
        return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" };
      case "PROCESSING":
        return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
      case "CONFIRMED":
        return { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" };
      case "PENDING":
        return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" };
      case "CANCELLED":
      case "RETURNED":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
      default:
        return { bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" };
    }
  }

  return (
    <AdminLayout
      title="Orders & Fulfillment Pipeline"
      actions={
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/shipping/sync", { method: "POST" });
                const d = await res.json();
                alert(`✓ Synced ${d.syncedCount || 0} active shipments with iThink Logistics!`);
                loadOrders();
              } catch (e: any) {
                alert(e.message || "Failed to sync tracking.");
              }
            }}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#0d4428",
              color: "#f5d77f",
              border: "1px solid #c59b27",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <TruckIcon size={12} /> Sync iThink Tracking
          </button>
          <button
            type="button"
            onClick={loadOrders}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#fff",
              border: "1px solid var(--border-medium)",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      }
    >
      {/* 6 SUMMARY STAT TILES INCLUDING PREPAID & COD BREAKDOWN */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Orders</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--color-noir)", margin: "3px 0" }}>{orders.length}</div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Gross: ₹{totalRevenue.toLocaleString("en-IN")}</span>
        </div>

        <div
          onClick={() => setPaymentFilter("PREPAID")}
          style={{
            background: paymentFilter === "PREPAID" ? "#f0fdf4" : "#fff",
            border: paymentFilter === "PREPAID" ? "1.5px solid #15803d" : "1px solid var(--border-subtle)",
            borderRadius: "6px",
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px" }}>💳 Prepaid Orders</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#15803d", margin: "3px 0" }}>{counts.PREPAID}</div>
          <span style={{ fontSize: "11px", color: "#166534" }}>₹{counts.prepaidRevenue.toLocaleString("en-IN")} (Online / Razorpay)</span>
        </div>

        <div
          onClick={() => setPaymentFilter("COD")}
          style={{
            background: paymentFilter === "COD" ? "#fff7ed" : "#fff",
            border: paymentFilter === "COD" ? "1.5px solid #c2410c" : "1px solid var(--border-subtle)",
            borderRadius: "6px",
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.5px" }}>💵 COD Orders</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#c2410c", margin: "3px 0" }}>{counts.COD}</div>
          <span style={{ fontSize: "11px", color: "#9a3412" }}>₹{counts.codRevenue.toLocaleString("en-IN")} (Doorstep Collect)</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Queue</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#c2410c", margin: "3px 0" }}>{counts.PENDING}</div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Awaiting confirmation</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>In Transit</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#0369a1", margin: "3px 0" }}>{counts.SHIPPED}</div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Out for delivery</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px" }}>Delivered</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#15803d", margin: "3px 0" }}>{counts.DELIVERED}</div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Successfully fulfilled</span>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
            <input
              type="text"
              placeholder="Search by Order #, Customer, Phone, Item, COD, or City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: "34px",
                padding: "0 12px 0 32px",
                border: "1px solid var(--border-medium)",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            />
            <div style={{ position: "absolute", left: "10px", top: "9px", color: "#a8a29e" }}>
              <SearchIcon size={14} />
            </div>
          </div>

          {/* Payment Filter Pill Tabs */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "#f8fafc", padding: "3px 6px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginRight: "4px" }}>
              Payment:
            </span>
            {[
              { id: "ALL", label: `All (${orders.length})` },
              { id: "PREPAID", label: `💳 Prepaid (${counts.PREPAID})` },
              { id: "COD", label: `💵 COD (${counts.COD})` },
            ].map((pf) => {
              const isSelected = paymentFilter === pf.id;
              return (
                <button
                  key={pf.id}
                  type="button"
                  onClick={() => setPaymentFilter(pf.id as any)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: isSelected ? "800" : "600",
                    border: isSelected
                      ? pf.id === "COD"
                        ? "1px solid #c2410c"
                        : pf.id === "PREPAID"
                        ? "1px solid #15803d"
                        : "1px solid var(--color-noir)"
                      : "1px solid transparent",
                    background: isSelected
                      ? pf.id === "COD"
                        ? "#c2410c"
                        : pf.id === "PREPAID"
                        ? "#15803d"
                        : "var(--color-noir)"
                      : "transparent",
                    color: isSelected ? "#fff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {pf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Status Filter Tabs */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
          <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginRight: "4px" }}>
            Status:
          </span>
          {["ALL", ...ORDER_STATUSES].map((st) => {
            const isSelected = statusFilter === st;
            const cnt = counts[st] ?? 0;

            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: isSelected ? "700" : "500",
                  border: isSelected ? "1px solid var(--color-noir)" : "1px solid var(--border-subtle)",
                  background: isSelected ? "var(--color-noir)" : "#fff",
                  color: isSelected ? "#fff" : "var(--color-noir)",
                  cursor: "pointer",
                }}
              >
                {st} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {/* COMPACT ORDERS TABLE */}
      {loading ? (
        <div style={{ padding: "50px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>Loading orders...</h3>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "50px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>No matching orders found</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Try adjusting your search query or filter.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", overflowX: "auto", boxShadow: "var(--shadow-xs)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px", minWidth: "920px" }}>
            <thead>
              <tr style={{ background: "#fafaf9", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "130px" }}>Order #</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "80px" }}>Date</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "160px" }}>Customer</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "120px" }}>Destination</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Ensembles Ordered</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "100px" }}>Payment</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "90px" }}>Total</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "120px" }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "100px", textAlign: "right" }}>Dossier</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const totalUnits = o.items?.reduce((s, it) => s + it.quantity, 0) || 0;
                const statusStyle = getStatusBadgeStyle(o.status);
                const isCod = (o.paymentMethod || "").toUpperCase() === "COD";

                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {/* Order Number */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        style={{ fontWeight: "700", color: "var(--brand-rose)", textDecoration: "none" }}
                      >
                        {o.orderNumber}
                      </Link>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "10px 14px" }}>
                      <strong style={{ color: "var(--color-noir)", display: "block" }}>
                        {o.customer?.name || o.shippingName}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        {o.customer?.phone || o.shippingPhone || o.customer?.email}
                      </span>
                    </td>

                    {/* Destination */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                      {o.shippingCity}, {o.shippingState}
                    </td>

                    {/* Ensembles */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            background: "#f3f4f6",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: "700",
                            flexShrink: 0,
                          }}
                        >
                          {totalUnits} {totalUnits === 1 ? "item" : "items"}
                        </span>
                        <span style={{ color: "var(--color-noir)", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                          {o.items?.[0]?.productName || "Ensemble"}
                          {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ""}
                        </span>
                      </div>
                    </td>

                    {/* Payment Mode */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {isCod ? (
                        <span
                          style={{
                            background: "#fff7ed",
                            color: "#c2410c",
                            border: "1px solid #fed7aa",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10.5px",
                            fontWeight: "800",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                          title="Cash on Delivery - Collect at Doorstep"
                        >
                          💵 COD
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#f0fdf4",
                            color: "#15803d",
                            border: "1px solid #bbf7d0",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10.5px",
                            fontWeight: "800",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                          title={o.razorpayPaymentId ? `Prepaid via Razorpay (${o.razorpayPaymentId})` : "Prepaid Online"}
                        >
                          💳 PREPAID
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <strong style={{ color: "var(--color-noir)", fontSize: "12px" }}>
                        ₹{Number(o.totalAmount).toLocaleString("en-IN")}
                      </strong>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            border: `1px solid ${statusStyle.border}`,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            display: "inline-block",
                            letterSpacing: "0.5px"
                          }}
                        >
                          {o.status}
                        </span>
                        {o.status === "DELIVERED" && (() => {
                          const returnCheck = evaluateReturnEligibility(o);
                          return (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                color: returnCheck.isEligible ? "#059669" : "#dc2626",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                              title={returnCheck.message}
                            >
                              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: returnCheck.isEligible ? "#10b981" : "#ef4444" }} />
                              {returnCheck.isEligible ? `5d return (${returnCheck.daysRemaining}d left)` : "5d return expired"}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        {/* Automated Cancel Order Button */}
                        {o.status !== "CANCELLED" && o.status !== "DELIVERED" && o.status !== "RETURNED" && (
                          <button
                            type="button"
                            disabled={cancellingOrderId === o.id}
                            onClick={() => handleCancelOrder(o.id, o.orderNumber)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              fontSize: "11px",
                              fontWeight: "800",
                              cursor: cancellingOrderId === o.id ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Cancel order and transmit cancellation to iThink Logistics"
                          >
                            {cancellingOrderId === o.id ? "Cancelling..." : "✕ Cancel Order"}
                          </button>
                        )}

                        {!o.awbNumber && o.status !== "CANCELLED" && (
                          <button
                            type="button"
                            disabled={pushingOrderId === o.id}
                            onClick={() => handlePushOrderToIThink(o.id)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              border: "1px solid #0284c7",
                              background: "#0284c7",
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: "800",
                              cursor: pushingOrderId === o.id ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Push order to iThink Logistics to generate AWB and label"
                          >
                            <TruckIcon size={12} /> {pushingOrderId === o.id ? "Pushing..." : "Push iThink"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocOrder(o);
                            setDocModalMode("combined");
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #0d4428",
                            background: "#0d4428",
                            color: "#f5d77f",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FileSpreadsheetIcon size={12} /> Invoice + Slip
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocOrder(o);
                            setDocModalMode("invoice");
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #0d4428",
                            background: "#f0f7f3",
                            color: "#0d4428",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <ReceiptIcon size={12} /> Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocOrder(o);
                            setDocModalMode("refund");
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #b91c1c",
                            background: "#fff",
                            color: "#b91c1c",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Process Return & Refund"
                        >
                          <RefreshCwIcon size={11} /> Return / Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocOrder(o);
                            setDocModalMode("dispatch");
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #c59b27",
                            background: "#fdfbf7",
                            color: "#967417",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <TruckIcon size={12} /> Dispatch
                        </button>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-medium)",
                            background: "#fff",
                            color: "var(--color-noir)",
                            fontSize: "11px",
                            fontWeight: "600",
                            textDecoration: "none",
                          }}
                        >
                          Dossier →
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === o.id}
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid #fecaca",
                            background: "#fff5f5",
                            color: "#dc2626",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: deletingId === o.id ? "not-allowed" : "pointer",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Permanently remove order"
                        >
                          <TrashIcon size={12} />
                          {deletingId === o.id ? "..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeDocOrder && (
        <OrderDocumentsModal
          isOpen={Boolean(activeDocOrder)}
          onClose={() => setActiveDocOrder(null)}
          order={activeDocOrder}
          mode={docModalMode}
          onStatusUpdate={async (newStatus) => {
            await handleStatusChange(activeDocOrder.id, newStatus);
          }}
        />
      )}
    </AdminLayout>
  );
}