"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, CustomerAddress } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { useToast } from "@/app/context/ToastContext";
import {
  UserIcon,
  PackageIcon,
  HeartIcon,
  LogOutIcon,
  ArrowRightIcon,
  LifeBuoyIcon,
  CheckIcon,
  SparklesIcon,
  CloseIcon,
  TagIcon,
  CrownIcon,
  MapPinIcon,
  ScissorsIcon,
  MessageSquareIcon,
  TruckIcon,
  RefreshCwIcon,
  PrinterIcon,
  PhoneIcon,
} from "@/app/components/Icons";
import TicketDetailModal from "@/app/components/TicketDetailModal";
import OrderDocumentsModal from "@/app/components/OrderDocumentsModal";
import { SupportTicket } from "@/lib/tickets";
import { ProductInquiry } from "@/lib/inquiries";
import { evaluateReturnEligibility } from "@/lib/return-policy";

export default function CustomerAccountPage() {
  const router = useRouter();
  const { user, loading, logout, updateProfile, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "sizing" | "loyalty" | "profile" | "tickets" | "inquiries">("orders");

  // 5-Day Return Modal state
  const [returnModalOrder, setReturnModalOrder] = useState<any | null>(null);
  const [returnType, setReturnType] = useState<"RETURN_REFUND" | "SIZE_EXCHANGE">("RETURN_REFUND");
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Multi-Family Sizing state
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<"self" | "mother" | "sister" | "partner">("self");
  const [familySizing, setFamilySizing] = useState({
    self: { label: "Myself (Primary)", bust: "36", waist: "28", hip: "38", height: "5'6\"", shoe: "UK 6" },
    mother: { label: "Mother of the Bride", bust: "40", waist: "34", hip: "42", height: "5'4\"", shoe: "UK 7" },
    sister: { label: "Sister / Bridesmaid", bust: "34", waist: "26", hip: "36", height: "5'7\"", shoe: "UK 5" },
    partner: { label: "Groom / Partner", bust: "42", waist: "34", hip: "40", height: "5'11\"", shoe: "UK 9" },
  });

  // Loyalty Program state
  const [claimedVoucher, setClaimedVoucher] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    avatar: "",
    bustSize: "",
    waistSize: "",
    hipSize: "",
    height: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Address Book state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    tag: "Home",
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Tickets & Inquiries
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Invoice Print Modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  async function handleCustomerCancelOrder(orderId: string, orderNumber: string) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel Order #${orderNumber}? This will immediately transmit a cancellation request to logistics and restock the ensemble.`
    );
    if (!confirmed) return;

    try {
      setCancellingOrderId(orderId);
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: "Customer Dashboard Self-Cancellation" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order.");
      }
      showToast(data.message || `Order #${orderNumber} has been successfully cancelled!`, { type: "success" });
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || "Failed to cancel order.", { type: "error" });
    } finally {
      setCancellingOrderId(null);
    }
  }

  async function handleCustomerSubmitReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!returnModalOrder) return;
    try {
      setSubmittingReturn(true);
      const res = await fetch("/api/orders/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: returnModalOrder.id,
          reason: returnReason,
          returnType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register return request.");
      }
      showToast(data.message || "Return request successfully registered under 5-day policy!", { type: "success" });
      setReturnModalOrder(null);
      setReturnReason("");
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || "Failed to submit return request.", { type: "error" });
    } finally {
      setSubmittingReturn(false);
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/account/login");
    }
  }, [user, loading, router]);

  // Sync profileForm with authenticated user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        bustSize: user.bustSize || "",
        waistSize: user.waistSize || "",
        hipSize: user.hipSize || "",
        height: user.height || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      if (user.addresses) {
        setAddresses(user.addresses);
      }
    }
  }, [user]);

  // Fetch tickets, inquiries & fresh addresses
  useEffect(() => {
    if (user?.email) {
      async function loadCustomerData() {
        try {
          setLoadingTickets(true);
          setLoadingInquiries(true);
          setLoadingAddresses(true);

          const [tRes, iRes, aRes] = await Promise.all([
            fetch(`/api/support/tickets?email=${encodeURIComponent(user?.email || "")}`),
            fetch(`/api/inquiries?email=${encodeURIComponent(user?.email || "")}`),
            fetch("/api/customer/addresses"),
          ]);

          if (tRes.ok) {
            const tData = await tRes.json();
            setTickets(tData.tickets || []);
          }

          if (iRes.ok) {
            const iData = await iRes.json();
            setInquiries(iData.inquiries || []);
          }

          if (aRes.ok) {
            const aData = await aRes.json();
            setAddresses(aData.addresses || []);
          }
        } catch {
          // ignore
        } finally {
          setLoadingTickets(false);
          setLoadingInquiries(false);
          setLoadingAddresses(false);
        }
      }
      loadCustomerData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <main className="section-wrapper" style={{ maxWidth: "1000px", padding: "80px 20px" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Loading your member profile...</h2>
        </div>
      </main>
    );
  }

  async function handleLogout() {
    await logout();
    showToast("Signed out successfully", { type: "info" });
    router.push("/");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        showToast("New passwords do not match", { type: "error" });
        return;
      }
      if (profileForm.newPassword.length < 6) {
        showToast("Password must be at least 6 characters", { type: "error" });
        return;
      }
    }

    setSavingProfile(true);
    const res = await updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      avatar: profileForm.avatar,
      bustSize: profileForm.bustSize,
      waistSize: profileForm.waistSize,
      hipSize: profileForm.hipSize,
      height: profileForm.height,
      currentPassword: profileForm.currentPassword || undefined,
      newPassword: profileForm.newPassword || undefined,
    });

    setSavingProfile(false);

    if (res.success) {
      showToast("Profile details updated successfully!", { type: "success" });
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } else {
      showToast(res.error || "Failed to update profile", { type: "error" });
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large, please select an image under 5MB.", { type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 300;
        
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setProfileForm(prev => ({ ...prev, avatar: dataUrl }));
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  // Address Handlers

  function openAddAddressModal() {
    setEditingAddressId(null);
    setAddressForm({
      tag: "Home",
      name: user?.name || "",
      phone: user?.phone || "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  }

  function openEditAddressModal(addr: CustomerAddress) {
    setEditingAddressId(addr.id);
    setAddressForm({
      tag: addr.tag,
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setAddressModalOpen(true);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSavingAddress(true);

    try {
      if (editingAddressId) {
        // Update existing address
        const res = await fetch("/api/customer/addresses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingAddressId, ...addressForm }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update address");
        showToast("Address updated successfully!", { type: "success" });
      } else {
        // Create new address
        const res = await fetch("/api/customer/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add address");
        showToast("New address saved to your address book!", { type: "success" });
      }

      setAddressModalOpen(false);
      await refreshUser();
      const aRes = await fetch("/api/customer/addresses");
      if (aRes.ok) {
        const aData = await aRes.json();
        setAddresses(aData.addresses || []);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save address", { type: "error" });
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("Are you sure you want to remove this address?")) return;

    try {
      const res = await fetch(`/api/customer/addresses?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete address");
      showToast("Address removed", { type: "info" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || "Could not delete address", { type: "error" });
    }
  }

  async function handleSetDefaultAddress(addr: CustomerAddress) {
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: addr.id, isDefault: true }),
      });
      if (!res.ok) throw new Error("Failed to set default");
      showToast("Default shipping destination updated", { type: "success" });
      const aRes = await fetch("/api/customer/addresses");
      if (aRes.ok) {
        const aData = await aRes.json();
        setAddresses(aData.addresses || []);
      }
    } catch (err: any) {
      showToast(err.message || "Could not update default", { type: "error" });
    }
  }

  const orders = user.orders || [];

  return (
    <main className="section-wrapper" style={{ maxWidth: "1160px", padding: "50px 5% 100px" }}>
      {/* PROFILE BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f7 100%)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          padding: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          marginBottom: "36px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #fff",
                boxShadow: "0 4px 12px rgba(155, 77, 101, 0.25)",
              }}
            />
          ) : (
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--brand-rose), #7a3a4e)",
                color: "#fff",
                fontSize: "26px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(155, 77, 101, 0.3)",
                border: "2px solid #fff",
                fontFamily: "var(--font-serif)",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

            <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "24px", margin: 0 }}>{user.name}</h1>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  background: "linear-gradient(135deg, #072818, #0d4428)",
                  border: "1px solid #c59b27",
                  color: "#f5d77f",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(13, 68, 40, 0.2)",
                }}
              >
                <CrownIcon size={13} /> PQN PRIVILEGE MEMBER
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "var(--color-text-muted)", fontSize: "13px" }}>
              {user.email} {user.phone && `• ${user.phone}`}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="/wishlist"
            className="btn btn-outline"
            style={{
              padding: "9px 18px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <HeartIcon size={16} /> Wishlist
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn"
            style={{
              background: "#fafaf9",
              border: "1px solid var(--border-medium)",
              color: "#78716c",
              padding: "9px 18px",
              fontSize: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            <LogOutIcon size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* DASHBOARD TABS NAVIGATION - LUXURY SEGMENTED CONTROL WITH SVGS */}
      <div
        style={{
          background: "#f0f5f2",
          border: "1px solid #dce8e0",
          borderRadius: "10px",
          padding: "6px",
          marginBottom: "32px",
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {[
          { id: "orders", label: "My Orders", icon: <PackageIcon size={15} />, count: orders.length },
          { id: "loyalty", label: "Royal Empress Club (1,450 Pts)", icon: <CrownIcon size={15} /> },
          { id: "sizing", label: "Bespoke Sizing", icon: <ScissorsIcon size={15} /> },
          { id: "addresses", label: "Saved Addresses", icon: <MapPinIcon size={15} />, count: addresses.length },
          { id: "profile", label: "Profile Details", icon: <UserIcon size={15} /> },
          { id: "tickets", label: "Support Tickets", icon: <LifeBuoyIcon size={15} />, count: tickets.length },
          { id: "inquiries", label: "Bespoke Inquiries", icon: <MessageSquareIcon size={15} />, count: inquiries.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "9px 16px",
                fontSize: "12.5px",
                fontWeight: isActive ? "800" : "600",
                color: isActive ? "#f5d77f" : "#4a6350",
                background: isActive ? "linear-gradient(135deg, #072818 0%, #0d4428 100%)" : "transparent",
                border: isActive ? "1px solid #c59b27" : "1px solid transparent",
                borderRadius: "7px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: isActive ? "0 4px 14px rgba(13, 68, 40, 0.25)" : "none",
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#0d4428";
                  e.currentTarget.style.borderColor = "#cce2d3";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#4a6350";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "800",
                    background: isActive ? "#c59b27" : "#dce7e0",
                    color: isActive ? "#072818" : "#0d4428",
                    padding: "1px 7px",
                    borderRadius: "10px",
                    marginLeft: "2px",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MY ORDERS */}
      {activeTab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <PackageIcon size={40} className="text-stone-300 mx-auto mb-4" />
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "8px" }}>
                No orders placed yet
              </h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "13px", maxWidth: "400px", margin: "0 auto 20px" }}>
                Explore our signature haute couture lehengas, suits, and sarees.
              </p>
              <Link href="/shop" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                Explore Collection
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "24px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "16px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                          Order #{order.orderNumber}
                        </h4>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.5px",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background:
                              order.status === "DELIVERED"
                                ? "#ecfdf5"
                                : order.status === "SHIPPED"
                                ? "#eff6ff"
                                : order.status === "PROCESSING"
                                ? "#fef3c7"
                                : order.status === "CANCELLED"
                                ? "#fef2f2"
                                : order.status === "RETURNED"
                                ? "#fffbeb"
                                : "#faf5ff",
                            color:
                              order.status === "DELIVERED"
                                ? "#065f46"
                                : order.status === "SHIPPED"
                                ? "#1e40af"
                                : order.status === "PROCESSING"
                                ? "#92400e"
                                : order.status === "CANCELLED"
                                ? "#991b1b"
                                : order.status === "RETURNED"
                                ? "#b45309"
                                : "#6b21a8",
                          }}
                        >
                          {order.status}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {order.status === "DELIVERED" && (() => {
                        const returnCheck = evaluateReturnEligibility(order);
                        return (
                          <div style={{ marginTop: "4px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", color: returnCheck.isEligible ? "#059669" : "#b91c1c" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: returnCheck.isEligible ? "#10b981" : "#ef4444" }} />
                            <span>{returnCheck.isEligible ? `5-Day Return Window Active (${returnCheck.daysRemaining}d left)` : "5-Day Return Window Expired"}</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block" }}>Total Amount</span>
                        <strong style={{ fontSize: "18px", color: "var(--brand-rose)" }}>
                          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <Link
                        href="/track-order"
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "1px solid #0d4428",
                          background: "#0d4428",
                          color: "#f5d77f",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <TruckIcon size={12} /> Live Track
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForInvoice(order)}
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-medium)",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Digital Invoice
                      </button>

                      {/* 5-DAY RETURN & EXCHANGE ACTION */}
                      {order.status === "DELIVERED" && (() => {
                        const returnCheck = evaluateReturnEligibility(order);
                        if (returnCheck.isEligible) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setReturnModalOrder(order);
                                setReturnType("RETURN_REFUND");
                                setReturnReason("");
                              }}
                              style={{
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "1px solid #10b981",
                                background: "#ecfdf5",
                                color: "#047857",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title={`5-Day Return Window Active: ${returnCheck.daysRemaining} day(s) left`}
                            >
                              <RefreshCwIcon size={11} /> Return Product ({returnCheck.daysRemaining}d left)
                            </button>
                          );
                        } else {
                          return (
                            <button
                              type="button"
                              disabled
                              title="Return window expired: The 5-day return policy has elapsed since delivery."
                              style={{
                                fontSize: "10.5px",
                                fontWeight: "700",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                background: "#f3f4f6",
                                border: "1px solid #e5e7eb",
                                color: "#9ca3af",
                                cursor: "not-allowed",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              ✕ Return Window Expired
                            </button>
                          );
                        }
                      })()}

                      {order.status === "RETURNED" && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: "700",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            color: "#92400e",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          ✓ Return Processed
                        </span>
                      )}

                      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "RETURNED" && (
                        <button
                          type="button"
                          disabled={cancellingOrderId === order.id}
                          onClick={() => handleCustomerCancelOrder(order.id, order.orderNumber)}
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            border: "1px solid #fca5a5",
                            background: "#fff",
                            color: "#dc2626",
                            cursor: cancellingOrderId === order.id ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            opacity: cancellingOrderId === order.id ? 0.6 : 1,
                          }}
                        >
                          {cancellingOrderId === order.id ? "Cancelling..." : "✕ Cancel Order"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {order.items?.map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          padding: "6px 0",
                        }}
                      >
                        <div>
                          <strong>{item.productName}</strong>
                          <span style={{ color: "var(--color-text-muted)", marginLeft: "8px" }}>
                            {item.size && `Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>
                            Qty: {item.quantity} × <strong style={{ color: "#1c1917" }}>₹{Number(item.price).toLocaleString("en-IN")}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              addToCart({
                                id: item.productId || item.id,
                                name: item.productName,
                                slug: item.productId || item.id,
                                price: Number(item.price),
                                image: "/logopq.png",
                                size: item.size || "M",
                                color: item.color || "",
                                quantity: 1,
                              });
                              showToast(`Added ${item.productName} to bag for re-order!`, {
                                type: "cart",
                                action: { label: "View Bag", href: "/cart" },
                              });
                            }}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "#f0f7f3",
                              color: "#0d4428",
                              border: "1px solid #cce2d3",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <RefreshCwIcon size={10} /> Re-Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address Footer */}
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px dashed var(--border-subtle)",
                      fontSize: "12px",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPinIcon size={12} /> Delivering to: <strong>{order.shippingName}</strong>, {order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
                    </span>
                    <Link
                      href={`/helpdesk?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                      style={{ color: "var(--brand-rose)", textDecoration: "underline", fontWeight: "600" }}
                    >
                      Need help with this order?
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED ADDRESSES BOOK */}
      {activeTab === "addresses" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "18px", margin: "0 0 4px 0", fontFamily: "var(--font-serif)" }}>Saved Delivery Addresses</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
                Manage your home, studio, and wedding venue delivery destinations.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddAddressModal}
              className="btn btn-primary"
              style={{ padding: "9px 18px", fontSize: "12px" }}
            >
              Add New Address
            </button>
          </div>

          {loadingAddresses ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                padding: "50px 20px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--color-text-muted)", marginBottom: "16px" }}>
                You have not saved any delivery addresses yet.
              </p>
              <button
                type="button"
                onClick={openAddAddressModal}
                className="btn btn-primary"
                style={{ padding: "9px 20px", fontSize: "12px" }}
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: addr.isDefault ? "2px solid var(--brand-rose)" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "20px",
                    position: "relative",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        background: "var(--bg-subtle)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {addr.tag}
                    </span>
                    {addr.isDefault && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "var(--brand-rose)",
                          background: "#fdf2f4",
                          padding: "2px 8px",
                          borderRadius: "10px",
                        }}
                      >
                        ✓ DEFAULT ADDRESS
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: "0 0 4px 0", fontSize: "15px" }}>{addr.name}</h4>
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 6px 0", lineHeight: "1.4" }}>
                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "4px" }}>
                    <PhoneIcon size={12} /> {addr.phone}
                  </p>

                  <div style={{ display: "flex", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => openEditAddressModal(addr)}
                      style={{
                        fontSize: "11px",
                        color: "var(--color-noir)",
                        fontWeight: "600",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr)}
                        style={{
                          fontSize: "11px",
                          color: "var(--brand-rose)",
                          fontWeight: "600",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{
                        fontSize: "11px",
                        color: "#dc2626",
                        fontWeight: "600",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        marginLeft: "auto",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROYAL EMPRESS LOYALTY & REWARDS DASHBOARD */}
      {activeTab === "loyalty" && (
        <div style={{ maxWidth: "840px" }}>
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "#c59b27", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              HAUTE COUTURE PRIVILEGE CIRCLE
            </span>
            <h3 style={{ fontSize: "22px", margin: "4px 0 6px 0", fontFamily: "var(--font-serif)", color: "#0d4428", display: "flex", alignItems: "center", gap: "8px" }}>
              <CrownIcon size={22} className="text-[#c59b27]" /> Royal Empress Loyalty Rewards
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
              Earn 1 Royal Point for every ₹100 spent. Redeem points for bespoke atelier vouchers, complimentary alterations, and VIP runway access.
            </p>
          </div>

          {/* LOYALTY STATUS CARD */}
          <div
            style={{
              background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
              borderRadius: "8px",
              padding: "28px 32px",
              color: "#fff",
              border: "1px solid rgba(197, 155, 39, 0.4)",
              boxShadow: "0 8px 24px rgba(7,40,24,0.3)",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#f5d77f", letterSpacing: "1px", textTransform: "uppercase" }}>
                  CURRENT MEMBERSHIP STATUS
                </span>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", color: "#f5d77f", margin: "4px 0" }}>
                  Gold Maharani Tier
                </h4>
                <p style={{ fontSize: "12px", color: "#e6f0ea", margin: 0 }}>
                  Account ID: PQN-EMPRESS-{user.email?.slice(0, 5).toUpperCase() || "7841"}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#f5d77f", fontWeight: "700", textTransform: "uppercase" }}>Available Reward Balance</span>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#fff", margin: "2px 0" }}>
                  1,450 <span style={{ fontSize: "16px", color: "#f5d77f" }}>Pts</span>
                </div>
                <span style={{ fontSize: "11.5px", color: "#e6f0ea" }}>= ₹1,450 Store Credit</span>
              </div>
            </div>

            {/* TIER PROGRESS */}
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#e6f0ea", marginBottom: "6px" }}>
                <span>Progress to <strong>Royal Empress Tier</strong> (₹50,000 Milestone)</span>
                <strong style={{ color: "#f5d77f" }}>72% Achieved</strong>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ width: "72%", height: "100%", background: "linear-gradient(90deg, #c59b27, #f5d77f)", borderRadius: "10px" }} />
              </div>
            </div>
          </div>

          {/* EXCLUSIVE UNLOCKED VIP VOUCHERS */}
          <div style={{ marginBottom: "28px" }}>
            <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", marginBottom: "12px", color: "var(--color-noir)" }}>
              Exclusive Tier Discount Codes
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ padding: "18px", borderRadius: "6px", border: "1px dashed #0d4428", background: "#f0f7f3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0d4428", display: "block" }}>MAHARANI15</strong>
                  <span style={{ fontSize: "11.5px", color: "#4b5563" }}>15% Off on all Couture Lehengas</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("MAHARANI15");
                    showToast("Copied code MAHARANI15 to clipboard!", { type: "success" });
                  }}
                  style={{ padding: "6px 12px", borderRadius: "4px", background: "#0d4428", color: "#f5d77f", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  COPY CODE
                </button>
              </div>

              <div style={{ padding: "18px", borderRadius: "6px", border: "1px dashed #c59b27", background: "#faf7ee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#854d0e", display: "block" }}>ROYALVIP20</strong>
                  <span style={{ fontSize: "11.5px", color: "#4b5563" }}>20% Off Wedding Ensembles &gt; ₹30,000</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("ROYALVIP20");
                    showToast("Copied code ROYALVIP20 to clipboard!", { type: "success" });
                  }}
                  style={{ padding: "6px 12px", borderRadius: "4px", background: "#c59b27", color: "#072818", border: "none", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                >
                  COPY CODE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BESPOKE MULTI-FAMILY SIZING & MEASUREMENTS */}
      {activeTab === "sizing" && (
        <div style={{ maxWidth: "780px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "20px", margin: "0 0 6px 0", fontFamily: "var(--font-serif)", display: "flex", alignItems: "center", gap: "8px" }}>
              <ScissorsIcon size={20} className="text-[#0d4428]" /> Multi-Profile Sizing & Family Measurements
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
              Save unique custom measurements for yourself and family members (Mother of Bride, Bridesmaids, Groom) for instant tailored fit during checkout.
            </p>
          </div>

          {/* FAMILY MEMBER PROFILE SWITCHER */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[
              { id: "self", label: "Myself (Primary)" },
              { id: "mother", label: "Mother of the Bride" },
              { id: "sister", label: "Sister / Bridesmaid" },
              { id: "partner", label: "Groom / Partner" },
            ].map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedFamilyMember(member.id as any)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: selectedFamilyMember === member.id ? "1.5px solid #0d4428" : "1px solid #d1d5db",
                  background: selectedFamilyMember === member.id ? "#0d4428" : "#fff",
                  color: selectedFamilyMember === member.id ? "#f5d77f" : "#374151",
                  transition: "all 0.15s ease",
                }}
              >
                {member.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              showToast(`Saved measurements for ${familySizing[selectedFamilyMember].label}!`, { type: "success" });
              handleSaveProfile(e);
            }}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "28px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#44403c" }}>Bust / Chest (Inches)</label>
                <input
                  type="text"
                  placeholder="e.g. 36"
                  className="form-input"
                  value={familySizing[selectedFamilyMember].bust}
                  onChange={(e) =>
                    setFamilySizing({
                      ...familySizing,
                      [selectedFamilyMember]: { ...familySizing[selectedFamilyMember], bust: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#44403c" }}>Waist (Inches)</label>
                <input
                  type="text"
                  placeholder="e.g. 28"
                  className="form-input"
                  value={familySizing[selectedFamilyMember].waist}
                  onChange={(e) =>
                    setFamilySizing({
                      ...familySizing,
                      [selectedFamilyMember]: { ...familySizing[selectedFamilyMember], waist: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#44403c" }}>Hips (Inches)</label>
                <input
                  type="text"
                  placeholder="e.g. 38"
                  className="form-input"
                  value={familySizing[selectedFamilyMember].hip}
                  onChange={(e) =>
                    setFamilySizing({
                      ...familySizing,
                      [selectedFamilyMember]: { ...familySizing[selectedFamilyMember], hip: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#44403c" }}>Height (Ft / Inches)</label>
                <input
                  type="text"
                  placeholder="e.g. 5'6&quot;"
                  className="form-input"
                  value={familySizing[selectedFamilyMember].height}
                  onChange={(e) =>
                    setFamilySizing({
                      ...familySizing,
                      [selectedFamilyMember]: { ...familySizing[selectedFamilyMember], height: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#44403c" }}>Footwear / Mojari Size (UK)</label>
                <input
                  type="text"
                  placeholder="e.g. UK 6"
                  className="form-input"
                  value={familySizing[selectedFamilyMember].shoe}
                  onChange={(e) =>
                    setFamilySizing({
                      ...familySizing,
                      [selectedFamilyMember]: { ...familySizing[selectedFamilyMember], shoe: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div style={{ background: "#f0f7f3", border: "1px solid #cce2d3", borderRadius: "4px", padding: "12px 16px", marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "#0d4428", display: "flex", alignItems: "center", gap: "6px" }}>
                <SparklesIcon size={14} /> Profile measurements saved here will automatically appear on product size selectors.
              </span>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
              style={{ padding: "11px 24px", fontSize: "13px" }}
            >
              {savingProfile ? "Saving..." : `Save ${familySizing[selectedFamilyMember].label} Sizing`}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: PROFILE DETAILS & SECURITY */}
      {activeTab === "profile" && (
        <div style={{ maxWidth: "680px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "18px", margin: "0 0 6px 0", fontFamily: "var(--font-serif)", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserIcon size={20} className="text-[#0d4428]" /> Account Details & Security
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
              Update your contact credentials and security password.
            </p>
          </div>

          <form
            onSubmit={handleSaveProfile}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
            }}
          >
            {/* AVATAR UPLOAD SECTION */}
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: profileForm.avatar ? `url(${profileForm.avatar}) center/cover no-repeat` : "#e5ede8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #c59b27",
                  overflow: "hidden",
                  flexShrink: 0
                }}
              >
                {!profileForm.avatar && <UserIcon size={32} className="text-[#0d4428]" />}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label htmlFor="avatar-upload" className="btn btn-secondary" style={{ padding: "8px 16px", cursor: "pointer", display: "inline-block", textAlign: "center" }}>
                  Upload Profile Picture
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Max size: 5MB. Will be resized automatically.
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address (Account Identifier)</label>
              <input
                type="email"
                disabled
                className="form-input"
                value={user.email}
                style={{ background: "#f5f5f4", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Contact Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +91 98765 43210"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            {/* PASSWORD CHANGE SECTION */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "20px", marginTop: "10px" }}>
              <h4 style={{ fontSize: "14px", margin: "0 0 12px 0", fontWeight: "700" }}>Change Account Password</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px" }}>Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password to change"
                    value={profileForm.currentPassword}
                    onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label style={{ fontSize: "12px" }}>New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Minimum 6 characters"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "12px" }}>Confirm New Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Re-enter new password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
              style={{ padding: "11px 24px", fontSize: "13px", alignSelf: "flex-start", marginTop: "10px" }}
            >
              {savingProfile ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS & COMPLAINTS */}
      {activeTab === "tickets" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "18px", margin: "0 0 4px 0", fontFamily: "var(--font-serif)" }}>Helpdesk Tickets & Complaints</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
                Track live resolution updates, review staff responses, and video evidence.
              </p>
            </div>
            <Link href="/helpdesk" className="btn btn-primary" style={{ padding: "9px 18px", fontSize: "12px" }}>
              File New Ticket
            </Link>
          </div>

          {loadingTickets ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                padding: "50px 20px",
                textAlign: "center",
              }}
            >
              <LifeBuoyIcon size={36} className="text-stone-300 mx-auto mb-3" />
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
                You do not have any active or past support tickets.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "18px 22px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "14px" }}>{t.subject}</strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: t.status === "RESOLVED" ? "#ecfdf5" : "#fef3c7",
                          color: t.status === "RESOLVED" ? "#065f46" : "#92400e",
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      Ticket #{t.id} • Created {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span style={{ fontSize: "12px", color: "var(--brand-rose)", fontWeight: "600" }}>
                    View Details →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BESPOKE INQUIRIES */}
      {activeTab === "inquiries" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", margin: "0 0 4px 0", fontFamily: "var(--font-serif)" }}>Bespoke Styling Inquiries</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>
              Your custom alteration, color customization, and bridal consultation requests.
            </p>
          </div>

          {loadingInquiries ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px dashed var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                padding: "50px 20px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
                You have not submitted any bespoke inquiries yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong>{inq.productName || "General Styling Inquiry"}</strong>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: inq.status === "RESOLVED" ? "#ecfdf5" : "#fef3c7",
                        color: inq.status === "RESOLVED" ? "#065f46" : "#92400e",
                      }}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-main)", margin: "0 0 8px 0" }}>
                    &ldquo;{inq.message}&rdquo;
                  </p>
                  {inq.adminNotes && (
                    <div style={{ background: "#faf8f7", padding: "10px 14px", borderRadius: "4px", fontSize: "12px", borderLeft: "3px solid var(--brand-rose)" }}>
                      <strong>Concierge Response:</strong> {inq.adminNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT ADDRESS MODAL */}
      {addressModalOpen && (
        <div
          className="search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddressModalOpen(false);
          }}
        >
          <div className="search-modal" style={{ maxWidth: "560px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", margin: 0, fontFamily: "var(--font-serif)" }}>
                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px" }}>Address Tag</label>
                  <select
                    className="form-input"
                    value={addressForm.tag}
                    onChange={(e) => setAddressForm({ ...addressForm, tag: e.target.value })}
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office / Studio</option>
                    <option value="Atelier">Atelier</option>
                    <option value="Wedding Venue">Wedding Venue / Suite</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "12px" }}>Recipient Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: "12px" }}>Contact Phone *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: "12px" }}>Street Address & Apartment / Landmark *</label>
                <textarea
                  required
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Flat 402, Royal Residency, Linking Road"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "12px" }}>City *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Mumbai"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "12px" }}>State *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Maharashtra"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "12px" }}>PIN Code *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="400050"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", margin: "6px 0" }}>
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  style={{ accentColor: "var(--brand-rose)" }}
                />
                <span>Set as my default delivery destination</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: "9px 18px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="btn btn-primary"
                  style={{ padding: "9px 22px", fontSize: "12px" }}
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL INVOICE & FULFILLMENT MODAL WITH OWNER SIGNATURE */}
      {selectedOrderForInvoice && (
        <OrderDocumentsModal
          isOpen={Boolean(selectedOrderForInvoice)}
          onClose={() => setSelectedOrderForInvoice(null)}
          order={selectedOrderForInvoice}
          mode="invoice"
          isCustomerView={true}
        />
      )}

      {/* TICKET DETAIL MODAL */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
      />

      {/* 5-DAY RETURN & EXCHANGE PORTAL MODAL */}
      {returnModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(7, 40, 24, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setReturnModalOrder(null);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#fff",
              borderRadius: "10px",
              padding: "32px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
              border: "1px solid var(--border-medium)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase" }}>
                🛡️ 5-DAY HAUTE COUTURE RETURN POLICY
              </span>
              <button
                type="button"
                onClick={() => setReturnModalOrder(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", margin: "0 0 6px", color: "var(--color-noir)" }}>
              Request Return or Size Exchange
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
              Order #{returnModalOrder.orderNumber} &bull; Total: ₹{Number(returnModalOrder.totalAmount).toLocaleString("en-IN")}
            </p>

            {(() => {
              const check = evaluateReturnEligibility(returnModalOrder);
              if (!check.isEligible) {
                return (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "16px", color: "#991b1b", fontSize: "13px", marginBottom: "20px" }}>
                    <strong>Return Window Expired:</strong> {check.message}
                  </div>
                );
              }
              return (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", padding: "12px 16px", color: "#065f46", fontSize: "12px", fontWeight: "600", marginBottom: "20px" }}>
                  ✓ {check.message}
                </div>
              );
            })()}

            <form onSubmit={handleCustomerSubmitReturn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                  Resolution Preference:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label
                    style={{
                      border: returnType === "RETURN_REFUND" ? "2px solid #0d4428" : "1px solid #d1d5db",
                      background: returnType === "RETURN_REFUND" ? "#f0f7f3" : "#fff",
                      padding: "12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="radio"
                      name="returnType"
                      value="RETURN_REFUND"
                      checked={returnType === "RETURN_REFUND"}
                      onChange={() => setReturnType("RETURN_REFUND")}
                      style={{ display: "none" }}
                    />
                    Return &amp; Refund
                  </label>
                  <label
                    style={{
                      border: returnType === "SIZE_EXCHANGE" ? "2px solid #0d4428" : "1px solid #d1d5db",
                      background: returnType === "SIZE_EXCHANGE" ? "#f0f7f3" : "#fff",
                      padding: "12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="radio"
                      name="returnType"
                      value="SIZE_EXCHANGE"
                      checked={returnType === "SIZE_EXCHANGE"}
                      onChange={() => setReturnType("SIZE_EXCHANGE")}
                      style={{ display: "none" }}
                    />
                    Size Exchange
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px", color: "#374151" }}>
                  Reason for Return / New Size Needed: *
                </label>
                <textarea
                  required
                  rows={3}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Size M fits snug around waist, would like to exchange for Size L / Color mismatch with theme..."
                  className="form-input"
                  style={{ height: "auto", padding: "10px", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setReturnModalOrder(null)}
                  className="btn btn-outline"
                  style={{ padding: "9px 18px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn || !evaluateReturnEligibility(returnModalOrder).isEligible}
                  className="btn btn-primary"
                  style={{ padding: "9px 24px", fontSize: "12px" }}
                >
                  {submittingReturn ? "Submitting Request..." : "Confirm Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
