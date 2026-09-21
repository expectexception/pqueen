"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import ShippingProviderManager from "@/app/components/admin/ShippingProviderManager";
import {
  CheckIcon,
  TagIcon,
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  SettingsIcon,
  TruckIcon,
  CreditCardIcon,
  UsersIcon,
  TargetIcon,
  BagIcon,
  DownloadCloudIcon,
  InstagramIcon,
  FacebookIcon,
  WhatsAppIcon,
  PinterestIcon,
  YouTubeIcon,
  TwitterIcon,
  ReceiptIcon,
  UploadCloudIcon,
  LockIcon,
} from "@/app/components/Icons";
import { compressImage } from "@/lib/image-upload-client";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "shipping" | "payments" | "staff" | "marketing" | "social" | "invoice">("general");
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");
  const [testEmailRecipient, setTestEmailRecipient] = useState("thep4rtyqueen@gmail.com");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState("");

  // Owner Signature Upload state
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const signatureFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "STORE_MANAGER",
  });

  async function handleSignatureFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Flexible MIME and extension check
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const validExtensions = ["png", "jpg", "jpeg", "webp", "svg"];
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml", "image/x-png", "image/pjpeg"];
    
    if (!validExtensions.includes(ext) && !validMimes.includes((file.type || "").toLowerCase())) {
      setSignatureStatus({
        type: "error",
        message: "Invalid file format. Please upload a PNG (transparent background recommended), JPG, WebP, or SVG image.",
      });
      return;
    }

    try {
      setUploadingSignature(true);
      setSignatureStatus(null);

      // Client-side instant compression (keeps PNG crisp & transparent, reduces camera photos from 10MB to ~80KB)
      const isPng = ext === "png" || (file.type || "").toLowerCase().includes("png");
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
        targetFormat: isPng ? "image/png" : "image/webp",
      });

      const res = await fetch("/api/admin/settings/upload-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: compressed.fileData,
          fileName: compressed.fileName || file.name,
          fileType: compressed.fileType || file.type || "image/png",
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(res.statusText || "Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload signature.");
      }

      setSettings((prev: any) => ({
        ...prev,
        invoiceOwnerSignatureUrl: data.url,
      }));
      setSignatureStatus({
        type: "success",
        message: "Owner signature uploaded and activated on all official invoices successfully!",
      });
    } catch (err: any) {
      setSignatureStatus({
        type: "error",
        message: err.message || "Failed to upload signature image.",
      });
    } finally {
      setUploadingSignature(false);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteSignature() {
    if (!confirm("Are you sure you want to delete the owner signature? Invoices will automatically display the standard verified signatory text without an image.")) {
      return;
    }

    try {
      setUploadingSignature(true);
      setSignatureStatus(null);
      const res = await fetch("/api/admin/settings/upload-signature", {
        method: "DELETE",
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(res.statusText || "Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete signature.");
      }

      setSettings((prev: any) => ({
        ...prev,
        invoiceOwnerSignatureUrl: null,
      }));
      setSignatureStatus({
        type: "success",
        message: "Owner signature deleted. Official invoices will use the clean fallback text.",
      });
    } catch (err: any) {
      setSignatureStatus({
        type: "error",
        message: err.message || "Failed to delete signature.",
      });
    } finally {
      setUploadingSignature(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmailRecipient) return;
    try {
      setSendingTestEmail(true);
      setTestEmailResult("");
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testEmailRecipient }),
      });
      const json = await res.json();
      if (res.ok) {
        setTestEmailResult(`✓ Live test email sent to ${testEmailRecipient}! Check your inbox.`);
      } else {
        setTestEmailResult(`✕ Error: ${json.error || "Failed to send test email"}`);
      }
    } catch (err: any) {
      setTestEmailResult(`✕ Network error: ${err.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  }

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load settings.");
      }
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        if (data.settings.smtpUser) {
          setTestEmailRecipient(data.settings.smtpUser);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load store settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to update settings.");
      setSavedMessage("Store configuration saved successfully.");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleAddStaffMember(e: React.FormEvent) {
    e.preventDefault();
    if (!settings || !newStaff.name || !newStaff.email) return;

    const staffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      active: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    const updatedStaff = [...(settings.staffMembers || []), staffMember];
    setSettings({ ...settings, staffMembers: updatedStaff });
    setIsStaffModalOpen(false);
    setNewStaff({ name: "", email: "", role: "STORE_MANAGER" });
    setSavedMessage(`Added ${staffMember.name} to authorized team.`);
    setTimeout(() => setSavedMessage(""), 3000);
  }

  function handleDeleteStaffMember(staffId: string) {
    if (!settings) return;
    if (!confirm("Are you sure you want to revoke this staff member's administrative access?")) return;

    const updatedStaff = settings.staffMembers.filter((s: any) => s.id !== staffId);
    setSettings({ ...settings, staffMembers: updatedStaff });
  }

  if (loading) {
    return (
      <AdminLayout title="Store Settings & Configuration">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)" }}>Loading configuration...</h3>
        </div>
      </AdminLayout>
    );
  }

  if (error || !settings) {
    return (
      <AdminLayout title="Store Settings & Configuration">
        <p style={{ color: "#991b1b" }}>{error || "Unable to load settings."}</p>
        <button type="button" onClick={loadSettings} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Store Settings & Configuration"
      actions={
        <button
          type="button"
          onClick={() => handleSaveSettings()}
          disabled={saving}
          className="btn-primary"
          style={{ padding: "8px 20px", fontSize: "12px" }}
        >
          {saving ? "SAVING..." : "SAVE ALL CONFIGURATION"}
        </button>
      }
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
            ENTERPRISE COMMERCE CONFIGURATION
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", margin: "4px 0" }}>
            Settings & Store Controls
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
            Manage brand identity, GST tax rules, courier zones, payment gateways, and staff role permissions.
          </p>
        </div>

        {/* NOTIFICATIONS */}
        {savedMessage && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "20px" }}>
            ✓ {savedMessage}
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "28px", overflowX: "auto" }}>
          {[
            { id: "general", label: "General & Tax Rules", icon: <SettingsIcon size={14} /> },
            { id: "invoice", label: "Invoice & Signature", icon: <ReceiptIcon size={14} /> },
            { id: "shipping", label: "Shipping Zones & Carriers", icon: <TruckIcon size={14} /> },
            { id: "payments", label: "Payment Gateways", icon: <CreditCardIcon size={14} /> },
            { id: "staff", label: "Staff Roles & Access", icon: <UsersIcon size={14} /> },
            { id: "marketing", label: "Meta Pixel & Instagram Catalog", icon: <TargetIcon size={14} /> },
            { id: "social", label: "Social Media & Community", icon: <InstagramIcon size={14} /> },
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

        {/* TAB 1: GENERAL & TAX RULES */}
        {activeTab === "general" && (
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* MAINTENANCE MODE & STOREFRONT AVAILABILITY */}
            <div
              style={{
                background: (settings.maintenanceMode?.enabled) ? "#fffbeb" : "#ffffff",
                border: (settings.maintenanceMode?.enabled) ? "2px solid #f59e0b" : "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "28px",
                boxShadow: (settings.maintenanceMode?.enabled) ? "0 4px 20px rgba(245, 158, 11, 0.15)" : "var(--shadow-xs)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: (settings.maintenanceMode?.enabled) ? "#d97706" : "#0d4428",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LockIcon size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "19px", margin: "0 0 2px 0", color: (settings.maintenanceMode?.enabled) ? "#92400e" : "#0d4428" }}>
                      Storefront Maintenance Mode
                    </h2>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>
                      Control whether public visitors can access the store or see your custom Private Curation screen.
                    </p>
                  </div>
                </div>

                {/* TOGGLE SWITCH */}
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = settings.maintenanceMode?.enabled ?? false;
                    setSettings({
                      ...settings,
                      maintenanceMode: {
                        ...settings.maintenanceMode,
                        enabled: !currentVal,
                      },
                    });
                  }}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    border: "none",
                    background: (settings.maintenanceMode?.enabled) ? "#dc2626" : "#15803d",
                    color: "#ffffff",
                    boxShadow: (settings.maintenanceMode?.enabled) ? "0 4px 14px rgba(220, 38, 38, 0.35)" : "0 4px 14px rgba(21, 128, 61, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {(settings.maintenanceMode?.enabled) ? "🔒 MAINTENANCE ON (STORE HIDDEN)" : "✓ STORE LIVE (MAINTENANCE OFF)"}
                </button>
              </div>

              {/* ADMIN ACCESS GUARANTEE NOTICE */}
              <div
                style={{
                  background: (settings.maintenanceMode?.enabled) ? "#fef3c7" : "#f0fdf4",
                  border: (settings.maintenanceMode?.enabled) ? "1px solid #fde68a" : "1px solid #bbf7d0",
                  borderRadius: "6px",
                  padding: "12px 16px",
                  fontSize: "12px",
                  color: (settings.maintenanceMode?.enabled) ? "#92400e" : "#166534",
                  marginBottom: "20px",
                  lineHeight: "1.6",
                }}
              >
                <strong>🛡️ Admin Security Guarantee:</strong> Even when Maintenance Mode is turned <strong>ON</strong>, your <strong>Admin Panel (`/admin/*`) and all management tools remain 100% accessible to you</strong> without interruption.
              </div>

              {/* MAINTENANCE DETAILS (SHOWN WHEN ACTIVE OR CONFIGURING) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Maintenance Page Heading:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.maintenanceMode?.title || "Atelier Private Preview & Scheduled Runway Upgrades"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenanceMode: {
                          ...settings.maintenanceMode,
                          title: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Atelier Private Preview & Scheduled Runway Upgrades"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Estimated Reopening Time / Date:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.maintenanceMode?.estimatedReopenTime || "Today at 6:00 PM IST"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenanceMode: {
                          ...settings.maintenanceMode,
                          estimatedReopenTime: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Today at 6:00 PM IST"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Public Explanation Message:
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={settings.maintenanceMode?.message || "Our digital atelier is currently undergoing curated runway updates. We are preparing our newest Haute Couture bridal & festive collections and will reopen shortly."}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenanceMode: {
                          ...settings.maintenanceMode,
                          message: e.target.value,
                        },
                      })
                    }
                    placeholder="Message shown to visiting patrons..."
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Emergency VIP WhatsApp Support:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.maintenanceMode?.emergencyWhatsApp || "+91 98765 43210"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maintenanceMode: {
                          ...settings.maintenanceMode,
                          emergencyWhatsApp: e.target.value,
                        },
                      })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Brand Identity */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "16px" }}>
                Brand & Business Identity
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Store Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.storeName}
                    onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Tagline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Atelier Registered Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Global Announcement Banner Message</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.announcementText}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                />
              </div>
            </div>

            {/* GST Tax & Invoicing Rules */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "16px" }}>
                GST Tax & Legal Compliance
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>GSTIN Registration No.</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textTransform: "uppercase", fontWeight: "700" }}
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>PAN Number</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textTransform: "uppercase", fontWeight: "700" }}
                    value={settings.panNumber}
                    onChange={(e) => setSettings({ ...settings, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Default GST Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="28"
                    className="form-input"
                    value={settings.defaultGSTRate}
                    onChange={(e) => setSettings({ ...settings, defaultGSTRate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Support Channels */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "16px" }}>
                Concierge & VIP Support
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Support Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Concierge WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.conciergeWhatsApp}
                    onChange={(e) => setSettings({ ...settings, conciergeWhatsApp: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* SMTP EMAIL DISPATCH & GMAIL AUTHENTICATION */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "#0d4428", textTransform: "uppercase" }}>
                    TRANSACTIONAL & NOTIFICATION ENGINE
                  </span>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "4px 0 0 0" }}>
                    Gmail SMTP & Automatic Dispatch
                  </h2>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: "14px", color: "#166534", fontSize: "11.5px", fontWeight: "800" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                  <span>GMAIL SMTP CONNECTED</span>
                </div>
              </div>

              <div style={{ background: "#f8faf8", border: "1px solid #e2ebe4", borderRadius: "8px", padding: "18px", marginBottom: "20px" }}>
                <table style={{ width: "100%", fontSize: "12.5px" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "6px 0", color: "#4b5563", fontWeight: 700, width: "160px" }}>Authenticated Sender:</td>
                      <td style={{ padding: "6px 0", fontFamily: "monospace", fontWeight: 700, color: "#0d4428" }}>{settings?.smtpUser || "thep4rtyqueen@gmail.com"}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "6px 0", color: "#4b5563", fontWeight: 700 }}>Active Email Pipeline:</td>
                      <td style={{ padding: "6px 0", color: "#111827" }}>Member Signup Welcome &bull; OTP Passcodes &bull; Order Invoices &bull; Real-time Courier Status &bull; Owner Alerts</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "6px 0", color: "#4b5563", fontWeight: 700 }}>SMTP Protocol:</td>
                      <td style={{ padding: "6px 0", color: "#111827" }}>{settings?.smtpHost || "smtp.gmail.com"}:{settings?.smtpPort || "465"} (SSL Encrypted &bull; App Password Authenticated)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* LIVE TEST EMAIL DISPATCH */}
              <div style={{ border: "1px dashed #c59b27", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                <strong style={{ fontSize: "13px", color: "#0d4428", display: "block", marginBottom: "6px" }}>
                  🧪 Live SMTP Delivery Verification:
                </strong>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px 0" }}>
                  Send a live test email from your connected Google account to verify instant inbox delivery.
                </p>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="email"
                    className="form-input"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Enter email to receive test..."
                    style={{ flex: "1 1 240px", fontSize: "12.5px" }}
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTestEmail}
                    style={{
                      padding: "10px 22px",
                      borderRadius: "6px",
                      background: "#0d4428",
                      color: "#f5d77f",
                      border: "1px solid #c59b27",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sendingTestEmail ? "DISPATCHING..." : "📤 SEND TEST EMAIL NOW"}
                  </button>
                </div>

                {testEmailResult && (
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: testEmailResult.startsWith("✓") ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {testEmailResult}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ padding: "12px 32px" }}>
                {saving ? "SAVING..." : "SAVE GENERAL SETTINGS"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SHIPPING ZONES & CARRIERS */}
        {activeTab === "shipping" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <ShippingProviderManager />
          </div>
        )}

        {/* TAB 3: PAYMENT GATEWAYS */}
        {activeTab === "payments" && (
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Razorpay */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    Razorpay Gateway (India Cards, UPI, Netbanking)
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Accept all Indian payment methods with instant settlement</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        razorpay: {
                          ...settings.paymentGateways.razorpay,
                          enabled: !settings.paymentGateways.razorpay.enabled,
                        },
                      },
                    });
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer",
                    border: "none",
                    background: settings.paymentGateways.razorpay.enabled ? "#0d4428" : "#e5e7eb",
                    color: settings.paymentGateways.razorpay.enabled ? "#f5d77f" : "#4b5563",
                  }}
                >
                  {settings.paymentGateways.razorpay.enabled ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Environment</label>
                  <select
                    className="form-input"
                    value={settings.paymentGateways.razorpay.mode}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          razorpay: {
                            ...settings.paymentGateways.razorpay,
                            mode: e.target.value,
                          },
                        },
                      });
                    }}
                  >
                    <option value="test">Test Mode</option>
                    <option value="live">Live Production</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Razorpay Key ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.paymentGateways.razorpay.keyId}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          razorpay: {
                            ...settings.paymentGateways.razorpay,
                            keyId: e.target.value,
                          },
                        },
                      });
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Razorpay Key Secret</label>
                  <input
                    type="password"
                    className="form-input"
                    value={settings.paymentGateways.razorpay.keySecret}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          razorpay: {
                            ...settings.paymentGateways.razorpay,
                            keySecret: e.target.value,
                          },
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cash on Delivery (COD) & UPI Direct */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* COD */}
              <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Cash on Delivery (COD)</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          cod: {
                            ...settings.paymentGateways.cod,
                            enabled: !settings.paymentGateways.cod.enabled,
                          },
                        },
                      });
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "10.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      border: "none",
                      background: settings.paymentGateways.cod.enabled ? "#15803d" : "#d1d5db",
                      color: "#fff",
                    }}
                  >
                    {settings.paymentGateways.cod.enabled ? "ACTIVE" : "OFF"}
                  </button>
                </div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Max COD Order Limit (₹):</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.paymentGateways.cod.maxCodAmount}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        cod: {
                          ...settings.paymentGateways.cod,
                          maxCodAmount: Number(e.target.value),
                        },
                      },
                    });
                  }}
                />
              </div>

              {/* UPI Direct */}
              <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>UPI Direct Atelier VPA</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        paymentGateways: {
                          ...settings.paymentGateways,
                          upi: {
                            ...settings.paymentGateways.upi,
                            enabled: !settings.paymentGateways.upi.enabled,
                          },
                        },
                      });
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "10.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      border: "none",
                      background: settings.paymentGateways.upi.enabled ? "#15803d" : "#d1d5db",
                      color: "#fff",
                    }}
                  >
                    {settings.paymentGateways.upi.enabled ? "ACTIVE" : "OFF"}
                  </button>
                </div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Official UPI VPA (Virtual Payment Address):</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.paymentGateways.upi.vpaAddress}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        upi: {
                          ...settings.paymentGateways.upi,
                          vpaAddress: e.target.value,
                        },
                      },
                    });
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ padding: "12px 32px" }}>
                {saving ? "SAVING..." : "SAVE PAYMENT GATEWAYS"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: STAFF & ROLE PERMISSIONS */}
        {activeTab === "staff" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0 }}>
                    Authorized Team Members & Roles
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Grant role-based access for catalog, order fulfillment, and client concierge
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(true)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "4px",
                    background: "#0d4428",
                    color: "#f5d77f",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <PlusIcon size={14} /> ADD STAFF MEMBER
                </button>
              </div>

              {/* STAFF TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f6f9f7", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px" }}>Team Member</th>
                    <th style={{ padding: "10px 14px" }}>Email</th>
                    <th style={{ padding: "10px 14px" }}>Role Permission</th>
                    <th style={{ padding: "10px 14px" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.staffMembers?.map((staff: any) => {
                    const roleLabel =
                      staff.role === "SUPER_ADMIN"
                        ? "👑 Super Admin"
                        : staff.role === "STORE_MANAGER"
                        ? "👗 Store & Catalog Manager"
                        : staff.role === "ORDER_SPECIALIST"
                        ? "📦 Fulfillment Specialist"
                        : "💬 Concierge Support";

                    return (
                      <tr key={staff.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ color: "#1c1917" }}>{staff.name}</strong>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6b7280" }}>{staff.email}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ padding: "3px 8px", borderRadius: "10px", background: "rgba(13,68,40,0.1)", color: "#0d4428", fontWeight: "700", fontSize: "11px" }}>
                            {roleLabel}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: staff.active ? "#15803d" : "#6b7280", fontWeight: "700" }}>
                            {staff.active ? "● ACTIVE" : "○ SUSPENDED"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          {staff.role !== "SUPER_ADMIN" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaffMember(staff.id)}
                              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #fee2e2", background: "#fff", color: "#991b1b", cursor: "pointer" }}
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: META PIXEL & INSTAGRAM CATALOG FEED */}
        {activeTab === "marketing" && settings && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. META PIXEL CARD */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0, color: "#0d4428" }}>
                    🎯 Meta Pixel (Instagram & Facebook Ad Tracking)
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "12.5px", margin: "4px 0 0" }}>
                    Track Instagram Reel traffic, ad clicks, product views, and purchases automatically in Meta Events Manager.
                  </p>
                </div>

                <span style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "800",
                  background: settings.metaPixelEnabled !== false ? "#dcfce7" : "#fee2e2",
                  color: settings.metaPixelEnabled !== false ? "#15803d" : "#991b1b",
                  border: `1px solid ${settings.metaPixelEnabled !== false ? "#bbf7d0" : "#fecaca"}`,
                }}>
                  {settings.metaPixelEnabled !== false ? "● PIXEL ACTIVE & TRACKING" : "○ PIXEL PAUSED"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Meta Pixel ID *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.metaPixelId || ""}
                    onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
                    placeholder="e.g. 128492019482019"
                    style={{ width: "100%", padding: "10px 14px", fontFamily: "monospace", fontSize: "13px" }}
                  />
                  <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                    Enter your Pixel ID from Meta Events Manager (Data Sources ➔ Pixel ID).
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Meta Pixel Status
                  </label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, metaPixelEnabled: true })}
                      style={{
                        flex: 1,
                        padding: "9px 14px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "700",
                        border: settings.metaPixelEnabled !== false ? "1.5px solid #0d4428" : "1px solid #d1d5db",
                        background: settings.metaPixelEnabled !== false ? "#0d4428" : "#fff",
                        color: settings.metaPixelEnabled !== false ? "#f5d77f" : "#374151",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Enabled (Active)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, metaPixelEnabled: false })}
                      style={{
                        flex: 1,
                        padding: "9px 14px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "700",
                        border: settings.metaPixelEnabled === false ? "1.5px solid #dc2626" : "1px solid #d1d5db",
                        background: settings.metaPixelEnabled === false ? "#fee2e2" : "#fff",
                        color: settings.metaPixelEnabled === false ? "#dc2626" : "#374151",
                        cursor: "pointer",
                      }}
                    >
                      ⏸ Disabled
                    </button>
                  </div>
                </div>
              </div>

              {/* TRACKED EVENTS GRID */}
              <div style={{ background: "#f8faf9", borderRadius: "6px", padding: "16px", border: "1px solid #e5ede8" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
                  ⚡ Automatically Tracked eCommerce Events:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#15803d", fontWeight: "bold" }}>✓</span>
                    <strong>PageView:</strong> Instagram Reel visitors & general traffic
                  </div>
                  <div style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#15803d", fontWeight: "bold" }}>✓</span>
                    <strong>ViewContent:</strong> Lehenga / Gown / Suit detail page visits
                  </div>
                  <div style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#15803d", fontWeight: "bold" }}>✓</span>
                    <strong>AddToCart:</strong> Items added to Shopping Bag
                  </div>
                  <div style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#15803d", fontWeight: "bold" }}>✓</span>
                    <strong>InitiateCheckout:</strong> Checkout step reached
                  </div>
                  <div style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#15803d", fontWeight: "bold" }}>✓</span>
                    <strong>Purchase:</strong> Completed orders with order total & ID
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PRODUCT CATALOG DATA FEEDS */}
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ marginBottom: "18px" }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0, color: "#0d4428" }}>
                  🛍️ Live Product Catalog Feed (Meta Commerce & Instagram Shopping)
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: "6px 0 0" }}>
                  यह Data Feed आपके सभी लहंगे, गाउन और सूट सेट्स को Meta Commerce Manager & Instagram Shopping से लाइव सिंक रखती है। जब भी आप वेबसाइट पर नया लहंगा अपलोड करेंगे या दाम बदलेंगे, वह इंस्टाग्राम पर अपने आप अपडेट हो जाएगा।
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* XML Feed Card */}
                <div style={{ border: "1px solid #c59b27", borderRadius: "6px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#072818" }}>
                      📡 Primary XML Catalog Feed URL (Recommended for Meta Commerce Manager)
                    </strong>
                    <span style={{ fontSize: "10px", background: "#0d4428", color: "#f5d77f", padding: "2px 8px", borderRadius: "10px", fontWeight: "700" }}>
                      LIVE AUTO-SYNC
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/api/feeds/meta` : "/api/feeds/meta"}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontFamily: "monospace", fontSize: "12.5px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const feedUrl = `${window.location.origin}/api/feeds/meta`;
                        navigator.clipboard.writeText(feedUrl);
                        setSavedMessage("Copied Primary XML Catalog Feed URL to clipboard!");
                        setTimeout(() => setSavedMessage(""), 3000);
                      }}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "4px",
                        background: "#0d4428",
                        color: "#f5d77f",
                        border: "1px solid #c59b27",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📋 Copy Feed URL
                    </button>
                    <a
                      href="/api/feeds/meta"
                      target="_blank"
                      style={{
                        padding: "9px 14px",
                        borderRadius: "4px",
                        background: "#fff",
                        color: "#0d4428",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                        fontWeight: "700",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🔗 Open Live XML
                    </a>
                  </div>
                </div>

                {/* CSV Feed Card */}
                <div style={{ border: "1px solid #e5ede8", borderRadius: "6px", padding: "18px", background: "#fafaf9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#374151" }}>
                      📊 CSV Catalog Data Feed (Excel & Manual Upload)
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}/api/feeds/catalog.csv` : "/api/feeds/catalog.csv"}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontFamily: "monospace", fontSize: "12.5px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const feedUrl = `${window.location.origin}/api/feeds/catalog.csv`;
                        navigator.clipboard.writeText(feedUrl);
                        setSavedMessage("Copied CSV Feed URL to clipboard!");
                        setTimeout(() => setSavedMessage(""), 3000);
                      }}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "4px",
                        background: "#fff",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📋 Copy CSV URL
                    </button>
                    <a
                      href="/api/feeds/catalog.csv"
                      download="pqn_catalog_feed.csv"
                      style={{
                        padding: "9px 16px",
                        borderRadius: "4px",
                        background: "#15803d",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "700",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📥 Download CSV
                    </a>
                  </div>
                </div>
              </div>

              {/* QUICK STEP GUIDE */}
              <div style={{ marginTop: "24px", padding: "18px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                <strong style={{ fontSize: "13px", color: "#166534", display: "block", marginBottom: "8px" }}>
                  📖 Meta Commerce Manager / Instagram Shopping Setup Guide:
                </strong>
                <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "12.5px", color: "#14532d", lineHeight: "1.7" }}>
                  <li>Open <a href="https://business.facebook.com/commerce" target="_blank" rel="noreferrer" style={{ fontWeight: "700", textDecoration: "underline", color: "#166534" }}>Meta Commerce Manager</a> ➔ Select your Business Account.</li>
                  <li>In the left sidebar, click <strong>Catalog ➔ Data Sources</strong>.</li>
                  <li>Click <strong>Add Items ➔ Data Feed</strong>.</li>
                  <li>Select <strong>"Set a Schedule"</strong> (Choose Hourly or Daily sync).</li>
                  <li>Paste the <strong>Primary XML Feed URL</strong> copied above and click <strong>Save & Upload</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SOCIAL MEDIA & COMMUNITY CHANNELS */}
        {activeTab === "social" && settings && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "#0d4428", textTransform: "uppercase" }}>
                  STOREFRONT FOOTER & COMMUNITY PROFILES
                </span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", margin: "4px 0", color: "#0d4428" }}>
                  Social Media Links & Community Channels
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
                  Manage the social media links displayed across the footer and luxury styling concierge. Toggle any channel ON or OFF.
                </p>
              </div>

              {/* SOCIAL MEDIA CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                {/* 1. INSTAGRAM */}
                <div style={{ border: "1px solid #d4e2d8", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#0d4428", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <InstagramIcon size={16} />
                      </div>
                      <strong style={{ fontSize: "14px", color: "#111827" }}>Instagram</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = settings.socialLinks?.instagram?.enabled ?? true;
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            instagram: {
                              ...settings.socialLinks?.instagram,
                              enabled: !cur,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: (settings.socialLinks?.instagram?.enabled ?? true) ? "#15803d" : "#9ca3af",
                        color: "#fff",
                      }}
                    >
                      {(settings.socialLinks?.instagram?.enabled ?? true) ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                    Instagram Profile URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={settings.socialLinks?.instagram?.url || "https://instagram.com/pqnpartyqueen"}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        socialLinks: {
                          ...settings.socialLinks,
                          instagram: {
                            ...settings.socialLinks?.instagram,
                            url: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="https://instagram.com/yourhandle"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                {/* 2. FACEBOOK */}
                <div style={{ border: "1px solid #d4e2d8", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#0d4428", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FacebookIcon size={16} />
                      </div>
                      <strong style={{ fontSize: "14px", color: "#111827" }}>Facebook</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = settings.socialLinks?.facebook?.enabled ?? true;
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            facebook: {
                              ...settings.socialLinks?.facebook,
                              enabled: !cur,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: (settings.socialLinks?.facebook?.enabled ?? true) ? "#15803d" : "#9ca3af",
                        color: "#fff",
                      }}
                    >
                      {(settings.socialLinks?.facebook?.enabled ?? true) ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                    Facebook Page URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={settings.socialLinks?.facebook?.url || "https://facebook.com/pqnpartyqueen"}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        socialLinks: {
                          ...settings.socialLinks,
                          facebook: {
                            ...settings.socialLinks?.facebook,
                            url: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="https://facebook.com/yourpage"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                {/* 3. WHATSAPP */}
                <div style={{ border: "1px solid #d4e2d8", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#15803d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <WhatsAppIcon size={16} />
                      </div>
                      <strong style={{ fontSize: "14px", color: "#111827" }}>WhatsApp VIP Styling</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = settings.socialLinks?.whatsapp?.enabled ?? true;
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            whatsapp: {
                              ...settings.socialLinks?.whatsapp,
                              enabled: !cur,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: (settings.socialLinks?.whatsapp?.enabled ?? true) ? "#15803d" : "#9ca3af",
                        color: "#fff",
                      }}
                    >
                      {(settings.socialLinks?.whatsapp?.enabled ?? true) ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                    WhatsApp Direct Chat URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={settings.socialLinks?.whatsapp?.url || "https://wa.me/919876543210"}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        socialLinks: {
                          ...settings.socialLinks,
                          whatsapp: {
                            ...settings.socialLinks?.whatsapp,
                            url: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="https://wa.me/919876543210"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                {/* 4. PINTEREST */}
                <div style={{ border: "1px solid #d4e2d8", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#b91c1c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PinterestIcon size={16} />
                      </div>
                      <strong style={{ fontSize: "14px", color: "#111827" }}>Pinterest Lookbooks</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = settings.socialLinks?.pinterest?.enabled ?? true;
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            pinterest: {
                              ...settings.socialLinks?.pinterest,
                              enabled: !cur,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: (settings.socialLinks?.pinterest?.enabled ?? true) ? "#15803d" : "#9ca3af",
                        color: "#fff",
                      }}
                    >
                      {(settings.socialLinks?.pinterest?.enabled ?? true) ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                    Pinterest Profile URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={settings.socialLinks?.pinterest?.url || "https://pinterest.com/pqnpartyqueen"}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        socialLinks: {
                          ...settings.socialLinks,
                          pinterest: {
                            ...settings.socialLinks?.pinterest,
                            url: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="https://pinterest.com/yourhandle"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                {/* 5. YOUTUBE */}
                <div style={{ border: "1px solid #d4e2d8", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#dc2626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <YouTubeIcon size={16} />
                      </div>
                      <strong style={{ fontSize: "14px", color: "#111827" }}>YouTube Runway Channel</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = settings.socialLinks?.youtube?.enabled ?? false;
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            youtube: {
                              ...settings.socialLinks?.youtube,
                              enabled: !cur,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: (settings.socialLinks?.youtube?.enabled ?? false) ? "#15803d" : "#9ca3af",
                        color: "#fff",
                      }}
                    >
                      {(settings.socialLinks?.youtube?.enabled ?? false) ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                    YouTube Channel URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={settings.socialLinks?.youtube?.url || "https://youtube.com/@pqnpartyqueen"}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        socialLinks: {
                          ...settings.socialLinks,
                          youtube: {
                            ...settings.socialLinks?.youtube,
                            url: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="https://youtube.com/@yourchannel"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>

                {/* 6. TWITTER / X */}
                <div style={{ border: "1px solid #d4e2d8", borderRadius: "8px", padding: "18px", background: "#fdfbf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <TwitterIcon size={16} />
                      </div>
                      <strong style={{ fontSize: "14px", color: "#111827" }}>X (Twitter)</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = settings.socialLinks?.twitter?.enabled ?? false;
                        setSettings({
                          ...settings,
                          socialLinks: {
                            ...settings.socialLinks,
                            twitter: {
                              ...settings.socialLinks?.twitter,
                              enabled: !cur,
                            },
                          },
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        cursor: "pointer",
                        border: "none",
                        background: (settings.socialLinks?.twitter?.enabled ?? false) ? "#15803d" : "#9ca3af",
                        color: "#fff",
                      }}
                    >
                      {(settings.socialLinks?.twitter?.enabled ?? false) ? "ACTIVE" : "DISABLED"}
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "#4b5563", marginBottom: "4px" }}>
                    X (Twitter) Profile URL:
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={settings.socialLinks?.twitter?.url || "https://x.com/pqnpartyqueen"}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        socialLinks: {
                          ...settings.socialLinks,
                          twitter: {
                            ...settings.socialLinks?.twitter,
                            url: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder="https://x.com/yourhandle"
                    style={{ width: "100%", fontSize: "12px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INVOICE SETTINGS & OWNER SIGNATURE */}
        {activeTab === "invoice" && (
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* HIDDEN SIGNATURE FILE INPUT */}
            <input
              ref={signatureFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleSignatureFileChange}
              style={{ display: "none" }}
            />

            {/* STATUS ALERT */}
            {signatureStatus && (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: signatureStatus.type === "success" ? "#dcfce7" : "#fee2e2",
                  color: signatureStatus.type === "success" ? "#15803d" : "#b91c1c",
                  border: signatureStatus.type === "success" ? "1px solid #86efac" : "1px solid #f87171",
                }}
              >
                {signatureStatus.type === "success" ? "✓" : "✕"} {signatureStatus.message}
              </div>
            )}

            {/* 1. OWNER SIGNATURE MANAGEMENT CARD */}
            <div style={{ background: "#ffffff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
                      OFFICIAL DOCUMENTATION
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: "800", background: "#f0fdf4", color: "#15803d", padding: "2px 8px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                      GST COMPLIANT
                    </span>
                  </div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: "0 0 4px 0", color: "#0d4428" }}>
                    Owner Signature & Authorized Signatory
                  </h2>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-muted)" }}>
                    Upload and manage the official owner signature image rendered on all customer invoices, warehouse dossiers, and PDF printouts.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => signatureFileInputRef.current?.click()}
                    disabled={uploadingSignature}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "5px",
                      background: "#0d4428",
                      color: "#f5d77f",
                      border: "1px solid #c59b27",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <UploadCloudIcon size={14} />
                    {uploadingSignature ? "Uploading..." : settings.invoiceOwnerSignatureUrl ? "Replace Signature" : "Upload Owner Signature"}
                  </button>

                  {settings.invoiceOwnerSignatureUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteSignature}
                      disabled={uploadingSignature}
                      style={{
                        padding: "9px 14px",
                        borderRadius: "5px",
                        background: "#fff1f2",
                        color: "#e11d48",
                        border: "1px solid #fecdd3",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <TrashIcon size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* SIGNATURE PREVIEW DISPLAY BOX */}
              <div
                style={{
                  background: "#f9fafb",
                  border: "1.5px dashed #cbd5e1",
                  borderRadius: "8px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "180px",
                  position: "relative",
                  marginBottom: "20px",
                }}
              >
                {settings.invoiceOwnerSignatureUrl ? (
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
                      Current Active Owner Signature Preview
                    </span>

                    {/* Checkered pattern box for transparent PNG contrast */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px 28px",
                        borderRadius: "6px",
                        background: "#ffffff",
                        backgroundImage: "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
                        marginBottom: "12px",
                      }}
                    >
                      <img
                        src={settings.invoiceOwnerSignatureUrl}
                        alt="Owner Signature"
                        style={{
                          maxHeight: "85px",
                          maxWidth: "280px",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 10px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <CheckIcon size={12} /> Active & Verified on Invoices
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "16px" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px",
                      }}
                    >
                      <ReceiptIcon size={26} />
                    </div>
                    <strong style={{ fontSize: "15px", color: "#334155", display: "block", marginBottom: "4px" }}>
                      No owner signature uploaded
                    </strong>
                    <p style={{ fontSize: "12.5px", color: "#64748b", maxWidth: "420px", margin: "0 auto 16px", lineHeight: "1.5" }}>
                      Upload a transparent PNG, JPG, or WebP signature image. It will appear automatically above &quot;For PQN PARTY QUEEN&quot; on every tax invoice and dispatch slip.
                    </p>
                    <button
                      type="button"
                      onClick={() => signatureFileInputRef.current?.click()}
                      disabled={uploadingSignature}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "5px",
                        background: "#0d4428",
                        color: "#f5d77f",
                        border: "1px solid #c59b27",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {uploadingSignature ? "Uploading..." : "Select Signature File"}
                    </button>
                  </div>
                )}
              </div>

              {/* FORMAT RECOMMENDATION HINT */}
              <div
                style={{
                  background: "#fdf8ea",
                  border: "1px solid #f3dc98",
                  borderRadius: "6px",
                  padding: "12px 16px",
                  fontSize: "12px",
                  color: "#785a08",
                  lineHeight: "1.55",
                }}
              >
                <strong>💡 Pro Tip:</strong> For the cleanest, highest-luxury appearance, use a <strong>transparent background PNG</strong> of the owner signature with dark blue, black, or gold ink. Maximum file size is <strong>5 MB</strong>.
              </div>
            </div>

            {/* 2. SIGNATORY & INVOICE ENTITY METADATA */}
            <div style={{ background: "#ffffff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 4px 0", color: "#0d4428" }}>
                Invoice Signatory & Entity Information
              </h2>
              <p style={{ margin: "0 0 20px 0", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
                These legal details are printed alongside the owner signature at the bottom of each Tax Invoice.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Authorized Signatory Name:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.invoiceSignatoryName ?? "Karan Oberoi"}
                    onChange={(e) => setSettings({ ...settings, invoiceSignatoryName: e.target.value })}
                    placeholder="e.g. Karan Oberoi"
                    style={{ width: "100%" }}
                  />
                  <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", display: "block" }}>
                    Printed under the signature line on invoice dossiers.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Signatory Designation / Title:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.invoiceSignatoryTitle ?? "Authorized Signatory"}
                    onChange={(e) => setSettings({ ...settings, invoiceSignatoryTitle: e.target.value })}
                    placeholder="e.g. Authorized Signatory / Atelier Director"
                    style={{ width: "100%" }}
                  />
                  <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", display: "block" }}>
                    Official role title (e.g. Authorized Signatory).
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Entity / Company Header on Signature:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.invoiceCompanyName ?? "PQN PARTY QUEEN"}
                    onChange={(e) => setSettings({ ...settings, invoiceCompanyName: e.target.value })}
                    placeholder="e.g. PQN PARTY QUEEN"
                    style={{ width: "100%" }}
                  />
                  <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", display: "block" }}>
                    Appears as &quot;For [Company Name]&quot; above the signatory.
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                    Place of Supply / Tax Jurisdiction:
                  </label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value="New Delhi, Delhi - 110001 (State Code 07)"
                    style={{ width: "100%", background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                  />
                  <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", display: "block" }}>
                    GSTIN: {settings.gstin || "07AAACP9876Q1Z2"} &bull; PAN: {settings.panNumber || "AAACP9876Q"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. LIVE INVOICE SIGNATURE MOCKUP DISPLAY */}
            <div style={{ background: "#ffffff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "28px", boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 2px 0", color: "#0d4428" }}>
                    Live Invoice Footer Simulation
                  </h2>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>
                    This is an exact preview of how the signature block renders on customer tax invoices.
                  </p>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#c59b27", background: "#fcf8ee", border: "1px solid #ebd9a4", padding: "4px 10px", borderRadius: "4px" }}>
                  PRINT PREVIEW
                </span>
              </div>

              <div style={{ background: "#ffffff", border: "1.5px solid #d4e2d8", borderRadius: "6px", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
                <div style={{ fontSize: "11.5px", color: "#374151", maxWidth: "340px", lineHeight: "1.5" }}>
                  <strong>Terms & Conditions:</strong><br />
                  1. 100% Authentic Handcrafted Haute Couture with complimentary 7-day exchange guarantee.<br />
                  2. All disputes subject to New Delhi jurisdiction only.<br />
                  3. Computer generated tax invoice under Section 31 of CGST Act 2017.
                </div>

                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
                    Authorized Signature
                  </span>

                  {settings.invoiceOwnerSignatureUrl ? (
                    <div style={{ height: "55px", minWidth: "140px", display: "flex", alignItems: "center", justifyContent: "flex-end", margin: "4px 0" }}>
                      <img
                        src={settings.invoiceOwnerSignatureUrl}
                        alt="Owner Signature Preview"
                        style={{
                          maxHeight: "52px",
                          maxWidth: "180px",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: "35px", width: "140px", borderBottom: "1.5px solid #9ca3af", margin: "4px 0 6px" }} />
                  )}

                  <strong style={{ fontSize: "12px", color: "#111827", display: "block" }}>
                    For {settings.invoiceCompanyName || "PQN PARTY QUEEN"}
                  </strong>
                  <span style={{ fontSize: "10.5px", color: "#4b5563" }}>
                    {settings.invoiceSignatoryName || "Karan Oberoi"} &bull; {settings.invoiceSignatoryTitle || "Authorized Signatory"}
                  </span>
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ padding: "10px 28px", fontSize: "13px" }}
              >
                {saving ? "SAVING..." : "SAVE INVOICE SETTINGS"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {isStaffModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsStaffModalOpen(false);
          }}
        >
          <div style={{ width: "100%", maxWidth: "500px", background: "#fff", borderRadius: "8px", padding: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", marginBottom: "16px" }}>
              Add Team Member
            </h2>

            <form onSubmit={handleAddStaffMember} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Full Name:</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Official Email Address:</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>Assigned Role:</label>
                <select
                  className="form-input"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="STORE_MANAGER">👗 Store & Catalog Manager</option>
                  <option value="ORDER_SPECIALIST">📦 Order Fulfillment Specialist</option>
                  <option value="SUPPORT_CONCIERGE">💬 Client Support Concierge</option>
                  <option value="SUPER_ADMIN">👑 Super Admin</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "8px 20px" }}>
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
