"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { PlusIcon, TrashIcon, TagIcon, PercentIcon } from "@/app/components/Icons";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number;
  active: boolean;
  expiryDate?: string | null;
  description?: string;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT" as "PERCENT" | "FIXED",
    value: 10,
    minOrderAmount: 0,
    active: true,
    expiryDate: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  async function loadCoupons() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load vouchers.");
      }
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err: any) {
      setError(err.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleToggleActive(coupon: Coupon) {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !coupon.active }),
      });

      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(couponId: string) {
    if (!confirm("Are you sure you want to delete this promotional coupon?")) return;

    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon.");

      setIsModalOpen(false);
      setForm({
        code: "",
        type: "PERCENT",
        value: 10,
        minOrderAmount: 0,
        active: true,
        expiryDate: "",
        description: "",
      });
      await loadCoupons();
    } catch (err: any) {
      setModalError(err.message || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout
      title="Coupons & Promotional Vouchers Engine"
      actions={
        <button
          type="button"
          onClick={() => {
            setModalError("");
            setIsModalOpen(true);
          }}
          className="btn-primary"
          style={{ padding: "8px 14px", fontSize: "12px" }}
        >
          <PlusIcon size={14} /> Create Voucher
        </button>
      }
    >
      {/* SUMMARY STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Configured Coupons</span>
          <div style={{ fontSize: "24px", fontWeight: "700", margin: "4px 0" }}>{coupons.length} Vouchers</div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Available for marketing campaigns</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#15803d", textTransform: "uppercase" }}>Active Vouchers</span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#15803d", margin: "4px 0" }}>
            {coupons.filter((c) => c.active).length} Live
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Valid for checkout discounts</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--brand-rose)", textTransform: "uppercase" }}>Primary Promo Code</span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--brand-rose)", margin: "4px 0" }}>PQN10</div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>10% Complimentary storewide</span>
        </div>
      </div>

      {/* COUPONS TABLE */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)" }}>Loading promotional engine...</h3>
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "60px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "20px" }}>No active promo codes</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Create your first campaign voucher.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Voucher Code</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Discount Value</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Min Order Rule</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Description</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {/* Code */}
                  <td style={{ padding: "16px 20px" }}>
                    <strong style={{ fontSize: "15px", letterSpacing: "1px", color: "var(--color-noir)" }}>
                      {c.code}
                    </strong>
                  </td>

                  {/* Value */}
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "var(--brand-rose)" }}>
                    {c.type === "PERCENT" ? `${c.value}% OFF` : `₹${c.value} FLAT OFF`}
                  </td>

                  {/* Min Order */}
                  <td style={{ padding: "16px 20px" }}>
                    {c.minOrderAmount > 0 ? `₹${c.minOrderAmount.toLocaleString("en-IN")}` : "No Minimum"}
                  </td>

                  {/* Description */}
                  <td style={{ padding: "16px 20px", color: "var(--color-text-muted)" }}>
                    {c.description || "—"}
                  </td>

                  {/* Status Toggle */}
                  <td style={{ padding: "16px 20px" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        border: "none",
                        cursor: "pointer",
                        background: c.active ? "#dcfce7" : "#fee2e2",
                        color: c.active ? "#15803d" : "#991b1b",
                      }}
                    >
                      {c.active ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid #fecaca",
                        background: "#fff",
                        color: "#991b1b",
                        cursor: "pointer",
                      }}
                      title="Delete Voucher"
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

      {/* CREATE COUPON MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <form
            onSubmit={handleSaveCoupon}
            style={{
              background: "#fff",
              borderRadius: "8px",
              maxWidth: "480px",
              width: "100%",
              padding: "32px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", margin: "0 0 6px" }}>
              Create Promotional Voucher
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 20px" }}>
              Customers can enter this code on the shopping cart to unlock order discounts.
            </p>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Promo Voucher Code *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. FESTIVE20"
                style={{ textTransform: "uppercase" }}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-row" style={{ marginBottom: "14px" }}>
              <div className="form-group">
                <label>Discount Type</label>
                <select
                  className="form-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Discount Value *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-input"
                  placeholder={form.type === "PERCENT" ? "10" : "500"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label>Minimum Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0 for no minimum"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label>Marketing Description (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 20% Off on orders above ₹5,000"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {modalError && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "4px", fontSize: "12px", marginBottom: "16px" }}>
                {modalError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                style={{
                  padding: "10px 16px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-medium)",
                  background: "#fff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{ padding: "10px 22px", fontSize: "13px" }}
              >
                {saving ? "SAVING..." : "CREATE VOUCHER"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
