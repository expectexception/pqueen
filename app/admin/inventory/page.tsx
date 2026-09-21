"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import { SearchIcon, PlusIcon, MinusIcon, CheckIcon } from "@/app/components/Icons";

type InventoryItem = {
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  category: string;
  image: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  status: string;
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "OUT" | "LOW" | "HEALTHY">("ALL");

  // Inline editing state
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function loadInventory() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inventory");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load inventory matrix.");
      }
      const data = await res.json();
      setInventory(data.inventory || []);

      // Initialize editing map
      const map: Record<string, number> = {};
      (data.inventory || []).forEach((item: InventoryItem) => {
        map[item.variantId] = item.stock;
      });
      setEditingValues(map);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  async function handleSaveStock(variantId: string) {
    const newStock = editingValues[variantId];
    if (newStock === undefined || newStock < 0) return;

    try {
      setSavingId(variantId);
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, stock: newStock }),
      });

      if (!res.ok) throw new Error("Failed to update stock.");

      setInventory((prev) =>
        prev.map((item) =>
          item.variantId === variantId ? { ...item, stock: newStock } : item
        )
      );

      setSavedId(variantId);
      setTimeout(() => setSavedId(null), 2500);
    } catch (err: any) {
      alert(err.message || "Could not update stock.");
    } finally {
      setSavingId(null);
    }
  }

  function handleAdjust(variantId: string, delta: number) {
    setEditingValues((prev) => {
      const current = prev[variantId] ?? 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [variantId]: updated };
    });
  }

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      if (stockFilter === "OUT" && item.stock !== 0) return false;
      if (stockFilter === "LOW" && (item.stock === 0 || item.stock > 5)) return false;
      if (stockFilter === "HEALTHY" && item.stock <= 5) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.size.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventory, stockFilter, search]);

  const summary = useMemo(() => {
    const totalUnits = inventory.reduce((sum, item) => sum + item.stock, 0);
    const outOfStock = inventory.filter((item) => item.stock === 0).length;
    const lowStock = inventory.filter((item) => item.stock > 0 && item.stock <= 5).length;
    const totalValuation = inventory.reduce((sum, item) => sum + item.stock * item.price, 0);

    return { totalUnits, outOfStock, lowStock, totalValuation };
  }, [inventory]);

  return (
    <AdminLayout title="Live Inventory Control Matrix">
      {/* SUMMARY METRIC STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Inventory Stock</span>
          <div style={{ fontSize: "24px", fontWeight: "700", margin: "4px 0" }}>{summary.totalUnits} units</div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Across {inventory.length} variant SKUs</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#dc2626", textTransform: "uppercase" }}>Out of Stock Alert</span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#dc2626", margin: "4px 0" }}>{summary.outOfStock} SKUs</div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Requires immediate restocking</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#d97706", textTransform: "uppercase" }}>Low Stock Warnings</span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#d97706", margin: "4px 0" }}>{summary.lowStock} SKUs</div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>&le; 5 pieces remaining</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "18px 20px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#15803d", textTransform: "uppercase" }}>Total Stock Asset Value</span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#15803d", margin: "4px 0" }}>₹{summary.totalValuation.toLocaleString("en-IN")}</div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>At current retail prices</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          padding: "16px 20px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search variant by product name, SKU, category, or size..."
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
          <div style={{ position: "absolute", left: "12px", top: "12px", color: "#a8a29e" }}>
            <SearchIcon size={16} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => setStockFilter("ALL")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              border: "1px solid var(--border-medium)",
              background: stockFilter === "ALL" ? "var(--color-noir)" : "#fff",
              color: stockFilter === "ALL" ? "#fff" : "var(--color-noir)",
              cursor: "pointer",
            }}
          >
            All ({inventory.length})
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("LOW")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              border: "1px solid #fde68a",
              background: stockFilter === "LOW" ? "#d97706" : "#fffbeb",
              color: stockFilter === "LOW" ? "#fff" : "#92400e",
              cursor: "pointer",
            }}
          >
            Low Stock ({summary.lowStock})
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("OUT")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              border: "1px solid #fecaca",
              background: stockFilter === "OUT" ? "#dc2626" : "#fef2f2",
              color: stockFilter === "OUT" ? "#fff" : "#991b1b",
              cursor: "pointer",
            }}
          >
            Out of Stock ({summary.outOfStock})
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("HEALTHY")}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              border: "1px solid #bbf7d0",
              background: stockFilter === "HEALTHY" ? "#16a34a" : "#f0fdf4",
              color: stockFilter === "HEALTHY" ? "#fff" : "#166534",
              cursor: "pointer",
            }}
          >
            In Stock
          </button>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)" }}>Loading inventory matrix...</h3>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "60px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "20px" }}>No inventory items found</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>No SKUs match your selected filter.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden", boxShadow: "var(--shadow-xs)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Ensemble & SKU</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Variant Size / Color</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Retail Price</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase" }}>Live Units in Stock</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Quick Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const currentVal = editingValues[item.variantId] ?? item.stock;
                const hasChanged = currentVal !== item.stock;

                return (
                  <tr key={item.variantId} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {/* Product & SKU */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "50px", borderRadius: "4px", overflow: "hidden", background: "var(--bg-elevated)", flexShrink: 0 }}>
                          {item.image ? (
                            <img src={item.image} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : null}
                        </div>
                        <div>
                          <Link href={`/admin/products/${item.productId}/edit`} style={{ fontWeight: "600", color: "var(--color-noir)", textDecoration: "none" }}>
                            {item.productName}
                          </Link>
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                            SKU: <strong>{item.sku}</strong> • {item.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Size & Color */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontWeight: "600" }}>{item.size}</span>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        Color: {item.color}
                      </div>
                    </td>

                    {/* Retail Price */}
                    <td style={{ padding: "14px 20px", fontWeight: "600" }}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </td>

                    {/* Stock Badge */}
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          background:
                            item.stock === 0
                              ? "#fee2e2"
                              : item.stock <= 5
                              ? "#fef3c7"
                              : "#dcfce7",
                          color:
                            item.stock === 0
                              ? "#991b1b"
                              : item.stock <= 5
                              ? "#92400e"
                              : "#15803d",
                        }}
                      >
                        {item.stock === 0 ? "Out of Stock" : item.stock <= 5 ? "Low Stock" : "In Stock"}
                      </span>
                    </td>

                    {/* Stepper Input */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border-medium)", borderRadius: "4px", background: "#fff" }}>
                        <button
                          type="button"
                          onClick={() => handleAdjust(item.variantId, -1)}
                          style={{ width: "28px", height: "30px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <MinusIcon size={12} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={currentVal}
                          onChange={(e) =>
                            setEditingValues({
                              ...editingValues,
                              [item.variantId]: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          style={{
                            width: "48px",
                            height: "30px",
                            border: "none",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAdjust(item.variantId, 1)}
                          style={{ width: "28px", height: "30px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <PlusIcon size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Save Button */}
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      {savedId === item.variantId ? (
                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "700" }}>
                          ✓ Saved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveStock(item.variantId)}
                          disabled={!hasChanged || savingId === item.variantId}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: hasChanged ? "var(--brand-rose)" : "#f3f4f6",
                            color: hasChanged ? "#fff" : "#9ca3af",
                            border: "none",
                            cursor: hasChanged ? "pointer" : "default",
                          }}
                        >
                          {savingId === item.variantId ? "Saving..." : "Save"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
