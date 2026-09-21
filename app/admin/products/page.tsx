"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import {
  PlusIcon,
  SearchIcon,
  TrashIcon,
  EyeIcon,
  CloseIcon,
  CheckIcon,
  PackageIcon,
  LayersIcon,
  DownloadCloudIcon,
  UploadCloudIcon,
  RefreshCwIcon,
  FileSpreadsheetIcon,
} from "@/app/components/Icons";

type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
};

type ProductVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  salePrice: string | null;
  status: string;
  weight?: string | number | null;
  length?: string | number | null;
  width?: string | number | null;
  height?: string | number | null;
  category: {
    id?: string;
    name: string;
  };
  images: ProductImage[];
  variants: ProductVariant[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Deleting State
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<Array<any>>([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load products");
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products ?? []);
    } catch (err: any) {
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleStatusToggle(productId: string, newStatus: string) {
    try {
      setUpdatingStatusId(productId);
      const targetProduct = products.find((p) => p.id === productId);
      if (!targetProduct) return;

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetProduct.name,
          slug: targetProduct.slug,
          sku: targetProduct.sku,
          price: targetProduct.price,
          salePrice: targetProduct.salePrice,
          categoryId: targetProduct.category?.id || (targetProduct as any).categoryId,
          status: newStatus,
          images: targetProduct.images,
          variants: targetProduct.variants,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || "Could not update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete product.");

      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || "Could not delete product.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Handle Download Catalog Template
  function handleDownloadTemplate() {
    window.location.href = "/api/admin/products/template";
  }

  // Parse CSV text for live preview
  function handleCsvTextChange(text: string) {
    setCsvRawText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }

    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setParsedPreview([]);
        return;
      }

      const parseLine = (line: string): string[] => {
        const values: string[] = [];
        let currentVal = "";
        let inQ = false;
        for (let j = 0; j < line.length; j++) {
          const c = line[j];
          const next = line[j + 1];
          if (c === '"' && next === '"' && inQ) {
            currentVal += '"';
            j++;
          } else if (c === '"') {
            inQ = !inQ;
          } else if (c === "," && !inQ) {
            values.push(currentVal.trim());
            currentVal = "";
          } else {
            currentVal += c;
          }
        }
        values.push(currentVal.trim());
        return values;
      };

      const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
      const previewRows = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length === 0 || row.every((r) => !r)) continue;

        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = row[idx] || "";
        });
        previewRows.push(rowObj);
      }

      setParsedPreview(previewRows);
    } catch (err) {
      console.warn("CSV Preview Parse Error:", err);
    }
  }

  // Handle File Upload Drop / Selection
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleCsvTextChange(content);
    };
    reader.readAsText(file);
  }

  // Execute Bulk Import
  async function handleImportProducts() {
    if (!csvRawText.trim()) {
      alert("Please upload an Excel / CSV file or paste product rows.");
      return;
    }

    try {
      setIsImporting(true);
      setImportMessage("");
      setImportErrors([]);

      const res = await fetch("/api/admin/products/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: csvRawText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to import product catalog.");
      }

      setImportMessage(data.message);
      if (data.errors && data.errors.length > 0) {
        setImportErrors(data.errors);
      }

      // Reload products catalog
      await loadProducts();

      // Reset modal after short delay if fully successful
      if (data.errorsCount === 0) {
        setTimeout(() => {
          setIsBulkModalOpen(false);
          setCsvRawText("");
          setParsedPreview([]);
          setFileName("");
          setImportMessage("");
        }, 2200);
      }
    } catch (err: any) {
      alert(err.message || "Failed to process bulk import.");
    } finally {
      setIsImporting(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "ALL" && p.category?.name !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && p.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchCat = p.category?.name?.toLowerCase().includes(q);
        return matchName || matchSku || matchCat;
      }
      return true;
    });
  }, [products, categoryFilter, statusFilter, search]);

  return (
    <AdminLayout
      title="Product Catalog & Inventory"
      actions={
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "nowrap" }}>
          {/* CSV TEMPLATE */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            style={{
              padding: "7px 12px",
              borderRadius: "5px",
              border: "1px solid #fef3c7",
              background: "#fffbeb",
              color: "#92400e",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
            title="Download CSV Catalog Template"
          >
            <DownloadCloudIcon size={14} /> Template
          </button>

          {/* BULK UPLOAD CATALOG */}
          <button
            type="button"
            onClick={() => {
              setIsBulkModalOpen(true);
              setImportMessage("");
              setImportErrors([]);
            }}
            style={{
              padding: "7px 12px",
              borderRadius: "5px",
              border: "1px solid #d1fae5",
              background: "#f0fdf4",
              color: "#065f46",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
            title="Import Excel / CSV Product Catalog"
          >
            <UploadCloudIcon size={14} /> Import CSV
          </button>

          {/* REFRESH */}
          <button
            type="button"
            onClick={loadProducts}
            style={{
              padding: "7px 10px",
              borderRadius: "5px",
              border: "1px solid var(--border-medium)",
              background: "#fff",
              color: "#4b5563",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
            title="Refresh Catalog List"
          >
            <RefreshCwIcon size={13} />
          </button>

          {/* ADD PRODUCT */}
          <Link
            href="/admin/products/new"
            style={{
              padding: "7px 14px",
              borderRadius: "5px",
              background: "#072818",
              color: "#f5d77f",
              border: "1px solid #c59b27",
              fontSize: "12px",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(7, 40, 24, 0.2)",
            }}
          >
            <PlusIcon size={14} /> Add Product
          </Link>
        </div>
      }
    >
      {/* COMPACT METRIC SUMMARY STRIP */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "18px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase" }}>Total Ensembles</span>
          <div style={{ fontSize: "20px", fontWeight: "700", margin: "2px 0" }}>{products.length}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
          <span style={{ fontSize: "10px", color: "#15803d", fontWeight: "700", textTransform: "uppercase" }}>Live Active</span>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", margin: "2px 0" }}>
            {products.filter((p) => p.status === "ACTIVE").length}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
          <span style={{ fontSize: "10px", color: "#d97706", fontWeight: "700", textTransform: "uppercase" }}>Drafts</span>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#d97706", margin: "2px 0" }}>
            {products.filter((p) => p.status === "DRAFT").length}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
          <span style={{ fontSize: "10px", color: "#78716c", fontWeight: "700", textTransform: "uppercase" }}>Archived</span>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#78716c", margin: "2px 0" }}>
            {products.filter((p) => p.status === "ARCHIVED").length}
          </div>
        </div>
      </div>

      {/* COMPACT SEARCH & FILTER CONTROLS */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "10px 14px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
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

        {/* Category Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)" }}>Cat:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: "34px",
              padding: "0 8px",
              border: "1px solid var(--border-medium)",
              borderRadius: "4px",
              fontSize: "12px",
              background: "#fff",
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-muted)" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: "34px",
              padding: "0 8px",
              border: "1px solid var(--border-medium)",
              borderRadius: "4px",
              fontSize: "12px",
              background: "#fff",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* COMPACT PRODUCTS TABLE */}
      {loading ? (
        <div style={{ padding: "50px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>Loading catalog products...</h3>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "50px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>No matching products found</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Try clearing your filters or upload a product catalog.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", overflowX: "auto", boxShadow: "var(--shadow-xs)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#fafaf9", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Ensemble</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Category</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>SKU</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Price (INR)</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Total Stock</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                const primaryImage = p.images?.[0]?.url || "/logo-gold.png";

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {/* Ensemble */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={primaryImage}
                          alt={p.name}
                          style={{
                            width: "36px",
                            height: "44px",
                            objectFit: "cover",
                            borderRadius: "3px",
                            background: "#f5f5f4",
                          }}
                        />
                        <div>
                          <strong style={{ color: "var(--color-noir)", display: "block", fontSize: "12.5px" }}>{p.name}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                              {p.variants?.length || 0} variant(s)
                            </span>
                            <span style={{ fontSize: "10px", color: "#78716c" }}>•</span>
                            {p.weight && Number(p.weight) > 0 ? (
                              <span style={{ fontSize: "11px", color: "#0d9488", fontWeight: "600" }}>
                                ⚖️ {Number(p.weight).toFixed(2)} kg ({p.length || 30}×{p.width || 25}×{p.height || 8}cm)
                              </span>
                            ) : (
                              <span style={{ fontSize: "10px", background: "#fef2f2", color: "#dc2626", padding: "1px 5px", borderRadius: "3px", fontWeight: "700", border: "1px solid #fecaca" }}>
                                ⚠️ Missing Weight
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#f5f5f4", padding: "2px 6px", borderRadius: "3px", fontSize: "11px", fontWeight: "500" }}>
                        {p.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    {/* SKU */}
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "11px", color: "#44403c" }}>
                      {p.sku || "-"}
                    </td>

                    {/* Price */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: "700", color: "var(--color-noir)" }}>
                        ₹{Number(p.salePrice || p.price).toLocaleString("en-IN")}
                      </div>
                      {p.salePrice && (
                        <span style={{ fontSize: "10px", textDecoration: "line-through", color: "#a8a29e" }}>
                          ₹{Number(p.price).toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>

                    {/* Total Stock */}
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: totalStock > 5 ? "#15803d" : totalStock > 0 ? "#b45309" : "#991b1b", fontWeight: "700" }}>
                        {totalStock} in stock
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td style={{ padding: "10px 14px" }}>
                      <select
                        value={p.status}
                        disabled={updatingStatusId === p.id}
                        onChange={(e) => handleStatusToggle(p.id, e.target.value)}
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          border: `1px solid ${p.status === "ACTIVE" ? "#86efac" : "#fed7aa"}`,
                          background: p.status === "ACTIVE" ? "#f0fdf4" : "#fff7ed",
                          color: p.status === "ACTIVE" ? "#166534" : "#9a3412",
                          cursor: "pointer",
                        }}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                        <Link
                          href={`/shop/${p.slug}`}
                          target="_blank"
                          title="View on Live Store"
                          style={{
                            padding: "4px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-medium)",
                            background: "#fff",
                            color: "var(--color-noir)",
                            display: "inline-flex",
                          }}
                        >
                          <EyeIcon size={12} />
                        </Link>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
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
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          style={{
                            padding: "4px 6px",
                            borderRadius: "4px",
                            border: "1px solid #fee2e2",
                            background: "#fff",
                            color: "#991b1b",
                            cursor: "pointer",
                            display: "inline-flex",
                          }}
                        >
                          <TrashIcon size={12} />
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

      {/* BULK UPLOAD CATALOG MODAL */}
      {isBulkModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(7, 40, 24, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBulkModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "960px",
              maxHeight: "92vh",
              background: "#ffffff",
              borderRadius: "10px",
              border: "1.5px solid #c59b27",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                background: "#072818",
                borderBottom: "1.5px solid #c59b27",
                padding: "16px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "#f5d77f", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <UploadCloudIcon size={20} /> Bulk Product Catalog Upload (Excel / CSV)
                </h2>
                <span style={{ fontSize: "12px", color: "#d4e2d8" }}>
                  Add multiple lehengas, sarees, gowns & jewelry to your store in one single click
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    background: "#c59b27",
                    color: "#072818",
                    border: "none",
                    fontSize: "11.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <DownloadCloudIcon size={13} /> Download Format (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#f5d77f", cursor: "pointer", padding: "4px" }}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {importMessage && (
                <div style={{ padding: "14px 18px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "6px", color: "#15803d", fontSize: "13px", fontWeight: "700", marginBottom: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckIcon size={16} /> {importMessage}
                </div>
              )}

              {importErrors.length > 0 && (
                <div style={{ padding: "14px 18px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "6px", color: "#991b1b", fontSize: "12px", marginBottom: "18px" }}>
                  <strong>Error Summary:</strong>
                  <ul style={{ margin: "6px 0 0", paddingLeft: "20px" }}>
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* STEP 1: DROPZONE / FILE SELECTOR */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #0d4428",
                  background: "#f6f9f7",
                  borderRadius: "8px",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  marginBottom: "20px",
                  transition: "background 0.15s ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#0d4428", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <FileSpreadsheetIcon size={24} />
                </div>
                <strong style={{ fontSize: "15px", color: "#0d4428", display: "block" }}>
                  {fileName ? `Selected File: ${fileName}` : "Click to Upload or Drag & Drop Excel / CSV Catalog File"}
                </strong>
                <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                  Supports pre-formatted .csv or .txt files. First row must match the template header format.
                </span>
              </div>

              {/* STEP 2: PASTE RAW CSV OPTION */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Or Paste CSV Data Directly Below:
                </label>
                <textarea
                  rows={4}
                  className="form-input"
                  placeholder="name,category,price,salePrice,sku,stock,sizes,colors,fabric,work,description,imageUrls,status..."
                  value={csvRawText}
                  onChange={(e) => handleCsvTextChange(e.target.value)}
                  style={{ width: "100%", fontFamily: "monospace", fontSize: "11.5px" }}
                />
              </div>

              {/* STEP 3: LIVE PARSED PREVIEW TABLE */}
              {parsedPreview.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#0d4428", display: "flex", alignItems: "center", gap: "6px" }}>
                      <EyeIcon size={14} /> Live Import Preview ({parsedPreview.length} Products Detected):
                    </span>
                    <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <CheckIcon size={12} /> Format Validated
                    </span>
                  </div>

                  <div style={{ border: "1px solid #d4e2d8", borderRadius: "6px", overflowX: "auto", maxHeight: "220px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px" }}>
                      <thead>
                        <tr style={{ background: "#f0f7f3", borderBottom: "1px solid #d4e2d8", textAlign: "left" }}>
                          <th style={{ padding: "8px 10px" }}>#</th>
                          <th style={{ padding: "8px 10px" }}>Product Name</th>
                          <th style={{ padding: "8px 10px" }}>Category</th>
                          <th style={{ padding: "8px 10px" }}>Price</th>
                          <th style={{ padding: "8px 10px" }}>Sale Price</th>
                          <th style={{ padding: "8px 10px" }}>SKU</th>
                          <th style={{ padding: "8px 10px" }}>Stock</th>
                          <th style={{ padding: "8px 10px" }}>Sizes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.slice(0, 15).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "6px 10px", color: "#6b7280" }}>{idx + 1}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#111827" }}>{row.name || row.productname}</td>
                            <td style={{ padding: "6px 10px" }}>{row.category || row.categoryname}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "700" }}>₹{row.price}</td>
                            <td style={{ padding: "6px 10px", color: "#b45309" }}>{row.saleprice ? `₹${row.saleprice}` : "-"}</td>
                            <td style={{ padding: "6px 10px", fontFamily: "monospace" }}>{row.sku}</td>
                            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#15803d" }}>{row.stock || 10}</td>
                            <td style={{ padding: "6px 10px" }}>{row.sizes || row.size || "Free Size"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedPreview.length > 15 && (
                    <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                      + Showing first 15 of {parsedPreview.length} items. All items will be imported.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                background: "#fafaf9",
                borderTop: "1px solid #e5e7eb",
                padding: "14px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "12px", color: "#4b5563" }}>
                {parsedPreview.length > 0 ? `Ready to import ${parsedPreview.length} products.` : "Upload file to start."}
              </span>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting || parsedPreview.length === 0}
                  onClick={handleImportProducts}
                  className="btn-primary"
                  style={{
                    padding: "8px 24px",
                    fontSize: "12px",
                    cursor: isImporting || parsedPreview.length === 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckIcon size={14} /> {isImporting ? "Importing Products..." : `Import & Publish ${parsedPreview.length || ""} Products`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
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
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#fee2e2", color: "#991b1b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <TrashIcon size={20} />
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 8px" }}>
              Delete Product?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: "1.5", margin: "0 0 20px" }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-medium)",
                  background: "#fff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                style={{
                  padding: "8px 18px",
                  borderRadius: "4px",
                  background: "#991b1b",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {isDeleting ? "DELETING..." : "DELETE PRODUCT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
