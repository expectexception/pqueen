"use client";

import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { SearchIcon, UserIcon } from "@/app/components/Icons";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hasAccount: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load customer list.");
      }
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err: any) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, search]);

  const totalRevenue = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalSpent, 0);
  }, [customers]);

  return (
    <AdminLayout title="Customer Directory & CRM">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
                CLIENT CRM DIRECTORY
              </span>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", margin: "4px 0" }}>
                Customer Database
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
                Track registered members, guest purchasers, order frequency, and lifetime spend.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCustomers}
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
              ↻ Refresh List
            </button>
          </div>

          {/* STATS STRIP */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "16px 20px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Customers</span>
              <div style={{ fontSize: "22px", fontWeight: "700" }}>{customers.length}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "16px 20px" }}>
              <span style={{ fontSize: "11px", color: "var(--brand-rose)", fontWeight: "600", textTransform: "uppercase" }}>Member Accounts</span>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "var(--brand-rose)" }}>
                {customers.filter((c) => c.hasAccount).length}
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "16px 20px" }}>
              <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "600", textTransform: "uppercase" }}>Cumulative Customer Value</span>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#15803d" }}>
                ₹{totalRevenue.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "14px 20px", marginBottom: "20px", position: "relative" }}>
            <input
              type="text"
              placeholder="Search by customer name, email address, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 14px 0 36px",
                border: "1px solid var(--border-medium)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
            <div style={{ position: "absolute", left: "32px", top: "25px", color: "#a8a29e" }}>
              <SearchIcon size={16} />
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-serif)" }}>Loading customer records...</h3>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "60px 20px", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "20px" }}>No customers found</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>No client records match your current search.</p>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Customer</th>
                    <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Phone</th>
                    <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Account Tier</th>
                    <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Total Orders</th>
                    <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Lifetime Value (LTV)</th>
                    <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong style={{ color: "var(--color-noir)" }}>{c.name}</strong>
                          {(c.emailVerified || c.phoneVerified) && (
                            <span style={{ fontSize: "9.5px", fontWeight: "800", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1px 6px", borderRadius: "10px" }}>
                              ✓ OTP Verified
                            </span>
                          )}
                        </div>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>{c.email}</span>
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--color-noir)" }}>
                        {c.phone || "—"}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: "700",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            background: c.hasAccount ? "var(--brand-rose-light)" : "var(--bg-elevated)",
                            color: c.hasAccount ? "var(--brand-rose)" : "var(--color-text-muted)",
                          }}
                        >
                          {c.hasAccount ? "VIP Member" : "Guest Buyer"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "600" }}>
                        {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: "700", color: "var(--brand-rose)" }}>
                        ₹{c.totalSpent.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--color-text-muted)", fontSize: "12px" }}>
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </AdminLayout>
  );
}
