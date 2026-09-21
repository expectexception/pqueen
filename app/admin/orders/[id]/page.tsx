"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import OrderDocumentsModal from "@/app/components/OrderDocumentsModal";
import OrderShippingActionCard from "@/app/components/admin/OrderShippingActionCard";
import {
  ReceiptIcon,
  FileSpreadsheetIcon,
  PackageIcon,
  TruckIcon,
  RefreshCwIcon,
  TrashIcon,
  PrinterIcon,
} from "@/app/components/Icons";
import { evaluateReturnEligibility } from "@/lib/return-policy";
import "./order-details.css";

type OrderItem = {
  id: string;
  productId: string;
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
  trackingUrl?: string | null;
  shippingStatus?: string | null;
  shippingError?: string | null;
  ithinkOrderId?: string | null;
  shippingLabelUrl?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  deliveredAt?: string | null;
  returnRequestedAt?: string | null;
  returnReason?: string | null;
  returnStatus?: string | null;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

function formatCurrency(value: string | number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: string): string {
  return `status-${status.toLowerCase()}`;
}

export default function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [docModalMode, setDocModalMode] = useState<"invoice" | "packingslip" | "shippinglabel" | "combined" | "refund" | null>(null);
  const [pushingToIThink, setPushingToIThink] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [pushResultMsg, setPushResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCancelOrder() {
    if (!order) return;
    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${order.orderNumber}? This will send a live cancellation API request to iThink Logistics, cancel the AWB, restock items, and confirm wallet refund.`
    );
    if (!confirmed) return;

    try {
      setCancelling(true);
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, reason: "Admin Detail Page Cancellation" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order with iThink Logistics.");
      }
      if (data.order) {
        setOrder(data.order);
      } else {
        setOrder({
          ...order,
          status: "CANCELLED",
          shippingStatus: "CANCELLED",
        });
      }
      alert(data.message || `✓ Order #${order.orderNumber} successfully cancelled.`);
    } catch (err: any) {
      alert(`✕ ${err.message || "Failed to cancel order."}`);
    } finally {
      setCancelling(false);
    }
  }

  async function handlePushToIThink() {
    if (!order) return;
    try {
      setPushingToIThink(true);
      setPushResultMsg(null);
      const res = await fetch("/api/admin/shipping/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to push order to iThink Logistics.");
      }
      if (data.order) {
        setOrder(data.order);
      } else {
        setOrder({
          ...order,
          awbNumber: data.awbNumber,
          courierName: data.courierName,
          trackingUrl: data.trackingUrl,
          shippingLabelUrl: data.shippingLabelUrl,
          ithinkOrderId: data.ithinkOrderId,
          status: "PROCESSING",
        });
      }
      setPushResultMsg({
        type: "success",
        text: `✓ Order successfully pushed to iThink Logistics! Assigned AWB: ${data.awbNumber || "Generated"}`,
      });
    } catch (err: any) {
      setPushResultMsg({
        type: "error",
        text: `✕ ${err.message || "Failed to push order to iThink Logistics."}`,
      });
    } finally {
      setPushingToIThink(false);
    }
  }

  async function handleDeleteOrder() {
    if (!order) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently remove Order #${order.orderNumber}? This will erase it from all records.`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(order.id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete order.");
      }

      window.location.href = "/admin/orders";
    } catch (err: any) {
      alert(err.message || "Failed to remove order.");
      setDeleting(false);
    }
  }

  useEffect(() => {
    async function loadOrder() {
      try {
        const { id } = await params;

        const response = await fetch("/api/orders", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load orders");
        }

        const data: {
          success: boolean;
          orders: Order[];
        } = await response.json();

        const foundOrder = data.orders.find(
          (currentOrder) => currentOrder.id === id
        );

        if (!foundOrder) {
          setError("Order not found.");
          return;
        }

        setOrder(foundOrder);
      } catch (err) {
        console.error(err);
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [params]);

  async function updateStatus(newStatus: string) {
    if (!order || updatingStatus) {
      return;
    }

    const previousStatus = order.status;

    setOrder({
      ...order,
      status: newStatus,
    });

    setUpdatingStatus(true);

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
    } catch (err) {
      console.error(err);

      setOrder({
        ...order,
        status: previousStatus,
      });

      alert("Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-order-details-page">
        <div className="admin-order-details-container">
          <Link href="/admin/orders" className="admin-back-link">
            ← Back to Orders
          </Link>

          <div className="admin-loading-card">
            <div className="admin-loading-spinner" />

            <h1>Loading Order</h1>

            <p>
              Please wait while we load the order details.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="admin-order-details-page">
        <div className="admin-order-details-container">
          <Link href="/admin/orders" className="admin-back-link">
            ← Back to Orders
          </Link>

          <div className="admin-error-card">
            <div className="admin-error-icon">!</div>

            <h1>Order Not Found</h1>

            <p>
              {error ||
                "The requested order could not be found."}
            </p>

            <Link
              href="/admin/orders"
              className="admin-primary-button"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(
    order.createdAt
  ).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const totalItems = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const isCod = (order.paymentMethod || "").toUpperCase() === "COD";

  return (
    <AdminLayout title={`Order Dossier #${order.orderNumber}`}>
      <div className="admin-order-details-container">

        {/* BACK */}

        <Link
          href="/admin/orders"
          className="admin-back-link"
        >
          ← Back to Orders
        </Link>

        {/* HEADER */}

        <div className="admin-details-header">
          <div>
            <p className="admin-details-label">
              ORDER DETAILS
            </p>

            <h1 className="admin-details-order-number">
              {order.orderNumber}
            </h1>

            <p className="admin-details-date">
              Placed on {formattedDate}
            </p>
          </div>

          <div className="admin-details-status-box" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
              Order Status
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                className={`order-status-select ${getStatusClass(order.status)}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "800",
                  display: "inline-block",
                  textAlign: "center",
                  letterSpacing: "0.5px"
                }}
              >
                {formatStatus(order.status)}
              </span>

              {order.status === "DELIVERED" && (() => {
                const returnCheck = evaluateReturnEligibility(order);
                return (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: returnCheck.isEligible ? "#ecfdf5" : "#fef2f2",
                      border: returnCheck.isEligible ? "1px solid #a7f3d0" : "1px solid #fecaca",
                      color: returnCheck.isEligible ? "#065f46" : "#991b1b",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    title={returnCheck.message}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: returnCheck.isEligible ? "#10b981" : "#ef4444" }} />
                    {returnCheck.isEligible ? `5-Day Return Window Active (${returnCheck.daysRemaining}d left)` : "5-Day Return Window Expired"}
                  </span>
                );
              })()}

              {order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "RETURNED" && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelOrder}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#991b1b",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: cancelling ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Cancel order and transmit cancellation to iThink Logistics"
                >
                  {cancelling ? "Cancelling with iThink..." : "✕ Cancel Order"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FULFILLMENT & INVOICE DOCUMENT BUTTONS BAR */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "16px 0 24px", padding: "14px 18px", background: "#f0f7f3", border: "1px solid #cce2d3", borderRadius: "8px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase" }}>
              Fulfillment Docs:
            </span>
            <button
              type="button"
              onClick={() => setDocModalMode("combined")}
              style={{ padding: "6px 14px", borderRadius: "4px", background: "#0d4428", border: "1px solid #c59b27", color: "#f5d77f", fontSize: "12px", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <PrinterIcon size={14} /> Download Invoice + Packing Slip + Courier Label
            </button>
            <button
              type="button"
              onClick={() => setDocModalMode("invoice")}
              style={{ padding: "6px 12px", borderRadius: "4px", background: "#fff", border: "1px solid #0d4428", color: "#0d4428", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <ReceiptIcon size={13} /> Tax Invoice
            </button>
            <button
              type="button"
              onClick={() => setDocModalMode("packingslip")}
              style={{ padding: "6px 12px", borderRadius: "4px", background: "#fff", border: "1px solid #0d4428", color: "#0d4428", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <PackageIcon size={13} /> Packing Slip
            </button>
            <button
              type="button"
              onClick={() => setDocModalMode("shippinglabel")}
              style={{ padding: "6px 12px", borderRadius: "4px", background: "#fff", border: "1px solid #0d4428", color: "#0d4428", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <TruckIcon size={13} /> Courier Label
            </button>
            <button
              type="button"
              onClick={() => setDocModalMode("refund")}
              style={{ padding: "6px 12px", borderRadius: "4px", background: "#fff", border: "1px solid #b91c1c", color: "#b91c1c", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <RefreshCwIcon size={13} /> Process Return &amp; Refund
            </button>

            {/* MANUAL RESYNC / PUSH TO ITHINK LOGISTICS BUTTON */}
            <button
              type="button"
              disabled={pushingToIThink}
              onClick={handlePushToIThink}
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                background: "#0284c7",
                border: "1px solid #0369a1",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "800",
                cursor: pushingToIThink ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <TruckIcon size={13} /> {pushingToIThink ? "Pushing to iThink..." : "🚀 Push to iThink Logistics"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setDocModalMode("refund")}
              style={{ padding: "6px 14px", borderRadius: "4px", background: "#991b1b", border: "none", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <RefreshCwIcon size={13} /> Return / Refund
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteOrder}
              style={{ padding: "6px 14px", borderRadius: "4px", background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "12px", fontWeight: "700", cursor: deleting ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <TrashIcon size={13} />
              {deleting ? "Removing..." : "Remove Order"}
            </button>
          </div>
        </div>

        {pushResultMsg && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: "700",
              background: pushResultMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
              border: `1.5px solid ${pushResultMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
              color: pushResultMsg.type === "success" ? "#065f46" : "#991b1b",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{pushResultMsg.text}</span>
            <button
              type="button"
              onClick={() => setPushResultMsg(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "900", color: "inherit" }}
            >
              ✕
            </button>
          </div>
        )}

        {order.shippingError && !pushResultMsg && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontSize: "13px",
              background: "#fff1f2",
              border: "1.5px solid #fda4af",
              color: "#9f1239",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "2px" }}>
                ⚠️ iThink Logistics Real-Time Push Notice:
              </strong>
              <span>{order.shippingError}</span>
            </div>
            <button
              type="button"
              disabled={pushingToIThink}
              onClick={handlePushToIThink}
              style={{
                padding: "6px 14px",
                background: "#9f1239",
                border: "none",
                color: "#ffffff",
                borderRadius: "4px",
                fontWeight: "800",
                fontSize: "12px",
                cursor: pushingToIThink ? "not-allowed" : "pointer"
              }}
            >
              {pushingToIThink ? "Retrying..." : "🚀 Retry Push to iThink"}
            </button>
          </div>
        )}

        {/* QUICK SUMMARY */}
        <div className="admin-order-stats">
          <div className="admin-order-stat">
            <span>Order Status</span>
            <strong className={getStatusClass(order.status)}>
              {formatStatus(order.status)}
            </strong>
          </div>

          <div className="admin-order-stat">
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="admin-order-stat">
            <span>Total Amount</span>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>

          <div className="admin-order-stat">
            <span>Payment</span>
            <strong style={{ color: isCod ? "#c2410c" : "#15803d" }}>
              {isCod ? "💵 Cash on Delivery (COD)" : "💳 Prepaid (Paid Online)"}
            </strong>
          </div>
        </div>

        {/* CUSTOMER + SHIPPING */}
        <div className="admin-details-grid">
          {/* CUSTOMER */}
          <section className="admin-details-card">
            <div className="admin-card-heading">
              <div className="admin-card-icon">👤</div>
              <div>
                <h2>Customer Information</h2>
                <p>Customer details</p>
              </div>
            </div>

            <div className="admin-detail-list">
              <div className="admin-detail-row">
                <span>Name</span>
                <strong>{order.customer.name}</strong>
              </div>

              <div className="admin-detail-row">
                <span>Email</span>
                <strong>{order.customer.email}</strong>
              </div>

              <div className="admin-detail-row">
                <span>Phone</span>
                <strong>{order.customer.phone || "N/A"}</strong>
              </div>
            </div>
          </section>

          {/* SHIPPING */}
          <section className="admin-details-card">
            <div className="admin-card-heading">
              <div className="admin-card-icon">📦</div>
              <div>
                <h2>Shipping Address</h2>
                <p>Delivery information</p>
              </div>
            </div>

            <div className="admin-shipping-details">
              <strong>{order.shippingName}</strong>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState}</p>
              <p>PIN Code: {order.shippingPincode}</p>
              <p>Phone: {order.shippingPhone}</p>
            </div>
          </section>
        </div>

        {/* MULTI-PROVIDER COURIER DISPATCH & LIVE TRACKING */}
        <OrderShippingActionCard
          order={order}
          onOrderUpdated={async () => {
            try {
              const { id } = await params;
              const res = await fetch("/api/orders", { cache: "no-store" });
              if (res.ok) {
                const data = await res.json();
                const found = data.orders.find((o: any) => o.id === id);
                if (found) setOrder(found);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />

        {/* ORDER ITEMS */}
        <section className="admin-details-card admin-items-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">🛍️</div>
            <div>
              <h2>Order Items</h2>
              <p>{totalItems} item{totalItems !== 1 ? "s" : ""} in this order</p>
            </div>
          </div>

          <div className="admin-items-table">
            <div className="admin-items-header">
              <span>Product</span>
              <span>Size</span>
              <span>Quantity</span>
              <span>Price</span>
            </div>

            {order.items.map((item) => (
              <div key={item.id} className="admin-details-item">
                <div className="admin-product-info">
                  <strong>{item.productName}</strong>
                  {item.color && <small>Color: {item.color}</small>}
                  <small>Product ID: {item.productId}</small>
                </div>

                <span>{item.size || "One Size"}</span>
                <span>× {item.quantity}</span>
                <strong>{formatCurrency(item.price)}</strong>
              </div>
            ))}
          </div>

          {/* TOTAL */}
          <div className="admin-order-total-row">
            <div>
              <span>Order Total</span>
              <small>Including all order items</small>
            </div>
            <strong>{formatCurrency(order.totalAmount)}</strong>
          </div>
        </section>

        {/* ORDER SUMMARY */}
        <section className="admin-details-card">
          <div className="admin-card-heading">
            <div className="admin-card-icon">📋</div>
            <div>
              <h2>Order Summary</h2>
              <p>Order & payment information</p>
            </div>
          </div>

          <div className="admin-summary-list">
            <div className="admin-summary-row">
              <span>Order Number</span>
              <strong>{order.orderNumber}</strong>
            </div>

            <div className="admin-summary-row">
              <span>Order Date</span>
              <strong>{formattedDate}</strong>
            </div>

            <div className="admin-summary-row">
              <span>Payment Mode</span>
              <strong style={{ color: isCod ? "#c2410c" : "#15803d" }}>
                {isCod ? "💵 Cash on Delivery (COD)" : "💳 Prepaid (Online)"}
              </strong>
            </div>

            {order.razorpayPaymentId && (
              <div className="admin-summary-row">
                <span>Razorpay Payment ID</span>
                <strong style={{ fontFamily: "monospace", fontSize: "11px" }}>
                  {order.razorpayPaymentId}
                </strong>
              </div>
            )}

            {order.awbNumber && (
              <div className="admin-summary-row">
                <span>Air Waybill (AWB)</span>
                <strong style={{ fontFamily: "monospace", fontSize: "11px", color: "#0d4428" }}>
                  {order.awbNumber}
                </strong>
              </div>
            )}

            <div className="admin-summary-row">
              <span>Order ID</span>
              <strong>{order.id}</strong>
            </div>

            <div className="admin-summary-row">
              <span>Status</span>
              <strong className={getStatusClass(order.status)}>
                {formatStatus(order.status)}
              </strong>
            </div>

            <div className="admin-summary-row">
              <span>Total Items</span>
              <strong>{totalItems}</strong>
            </div>

            <div className="admin-summary-row admin-summary-total">
              <span>Total</span>
              <strong>{formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>
        </section>

      </div>

      {docModalMode && (
        <OrderDocumentsModal
          isOpen={Boolean(docModalMode)}
          onClose={() => setDocModalMode(null)}
          order={order}
          mode={docModalMode}
          onStatusUpdate={async (newStatus) => {
            await updateStatus(newStatus);
          }}
        />
      )}
    </AdminLayout>
  );
}