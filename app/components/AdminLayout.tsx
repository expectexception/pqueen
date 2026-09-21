"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PackageIcon,
  PlusIcon,
  LogOutIcon,
  EyeIcon,
  ShieldCheckIcon,
  TagIcon,
  UserIcon,
  BarChartIcon,
  LayersIcon,
  PercentIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
  ChevronRightIcon,
  LifeBuoyIcon,
  SparklesIcon,
  TruckIcon,
  BookOpenIcon,
} from "@/app/components/Icons";

type AdminLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Desktop sidebar collapsed state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMaintenanceOn, setIsMaintenanceOn] = useState(false);

  // Close mobile drawer on route change & check maintenance mode
  useEffect(() => {
    setMobileOpen(false);

    async function checkMaintenanceStatus() {
      try {
        const res = await fetch("/api/settings/public", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.maintenanceMode?.enabled) {
            setIsMaintenanceOn(true);
          } else {
            setIsMaintenanceOn(false);
          }
        }
      } catch {
        // ignore
      }
    }
    checkMaintenanceStatus();
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  }

  const navGroups = [
    {
      group: "EXECUTIVE",
      items: [
        { label: "Dashboard", href: "/admin", icon: ShieldCheckIcon },
        { label: "Analytics", href: "/admin/analytics", icon: BarChartIcon },
      ],
    },
    {
      group: "COMMERCE",
      items: [
        { label: "Orders", href: "/admin/orders", icon: PackageIcon },
        { label: "Automatic Shipping Hub", href: "/admin/shipping", icon: TruckIcon },
        { label: "Fulfillment & WMS", href: "/admin/fulfillment", icon: LayersIcon },
        { label: "Products", href: "/admin/products", icon: TagIcon },
        { label: "Categories", href: "/admin/categories", icon: LayersIcon },
        { label: "Inventory", href: "/admin/inventory", icon: LayersIcon },
        { label: "Coupons", href: "/admin/coupons", icon: PercentIcon },
        { label: "Banners & Sliders", href: "/admin/banners", icon: SparklesIcon },
      ],
    },
    {
      group: "RELATIONS",
      items: [
        { label: "Customers", href: "/admin/customers", icon: UserIcon },
        { label: "Product Reviews", href: "/admin/reviews", icon: SparklesIcon },
        { label: "Client Inquiries", href: "/admin/inquiries", icon: EyeIcon },
        { label: "Helpdesk & Refunds", href: "/admin/tickets", icon: LifeBuoyIcon },
      ],
    },
    {
      group: "FINANCE",
      items: [
        { label: "Payments & Payouts", href: "/admin/payments", icon: TagIcon },
        { label: "Tax Compliance", href: "/admin/taxes", icon: ShieldCheckIcon },
        { label: "Financial Reports", href: "/admin/reports", icon: BarChartIcon },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
        { label: "Operations Guidebook", href: "/admin/guidebook", icon: BookOpenIcon },
      ],
    },
  ];

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }

  const sidebarWidth = collapsed ? "68px" : "240px";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#f8f7f5",
      }}
    >
      {/* DESKTOP PERMANENT & COLLAPSIBLE SIDEBAR */}
      <aside
        className="admin-desktop-sidebar"
        style={{
          width: sidebarWidth,
          background: "var(--color-noir)",
          flexShrink: 0,
          height: "100vh",
          zIndex: 40,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* BRAND CREST */}
        <div
          style={{
            height: "56px",
            padding: collapsed ? "0" : "0 18px",
            borderBottom: "1px solid #262626",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "6px",
              background: "#072818",
              border: "1px solid #c59b27",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              padding: "3px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <img
              src="/logo-gold.png?v=3"
              alt="PQN PARTY QUEEN"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "1.2px", color: "#f5d77f", fontFamily: "var(--font-serif)" }}>
                PQN ATELIER
              </div>
              <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "1px", color: "#c59b27", textTransform: "uppercase" }}>
                COMMAND • v2.0
              </span>
            </div>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: collapsed ? "12px 6px" : "14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: collapsed ? "8px" : "14px",
          }}
        >
          {navGroups.map((grp) => (
            <div key={grp.group}>
              {!collapsed && (
                <span
                  style={{
                    display: "block",
                    fontSize: "9px",
                    fontWeight: "700",
                    letterSpacing: "1.2px",
                    color: "#737373",
                    textTransform: "uppercase",
                    padding: "0 8px 4px",
                  }}
                >
                  {grp.group}
                </span>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: "10px",
                        padding: collapsed ? "9px 0" : "7px 10px",
                        borderRadius: "5px",
                        fontSize: "12px",
                        fontWeight: isActive ? "600" : "500",
                        background: isActive ? "var(--brand-rose)" : "transparent",
                        color: isActive ? "#ffffff" : "#a3a3a3",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon size={16} />
                      {!collapsed && (
                        <>
                          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.label}
                          </span>
                          {isActive && <ChevronRightIcon size={11} />}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER CONTROLS */}
        <div
          style={{
            padding: collapsed ? "10px 6px" : "10px 10px",
            borderTop: "1px solid #262626",
            background: "#121212",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            target="_blank"
            title="View Live Storefront"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "6px 8px",
              borderRadius: "4px",
              background: "#262626",
              color: "#e5e5e5",
              fontSize: "11px",
              fontWeight: "600",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <EyeIcon size={13} />
            {!collapsed && <span>Storefront</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Terminate Session"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid #450a0a",
              background: "#1c0404",
              color: "#f87171",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <LogOutIcon size={13} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY (ONLY APPLIES WHEN SCREEN < 992px) */}
      {mobileOpen && (
        <div
          className="admin-mobile-drawer"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
          }}
        >
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
            }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            style={{
              position: "relative",
              width: "260px",
              background: "var(--color-noir)",
              height: "100%",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: "56px",
                padding: "0 18px",
                borderBottom: "1px solid #262626",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#072818", border: "1px solid #c59b27", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "3px" }}>
                  <img src="/logo-gold.png?v=3" alt="PQN PARTY QUEEN" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <strong style={{ color: "#f5d77f", fontSize: "14px", fontFamily: "var(--font-serif)" }}>PQN ATELIER</strong>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                style={{ background: "none", border: "none", color: "#a3a3a3", cursor: "pointer" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
              {navGroups.map((grp) => (
                <div key={grp.group} style={{ marginBottom: "14px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "700", color: "#737373", textTransform: "uppercase", letterSpacing: "1px", padding: "0 8px 4px", display: "block" }}>
                    {grp.group}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {grp.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 10px",
                            borderRadius: "5px",
                            fontSize: "12px",
                            fontWeight: isActive ? "600" : "500",
                            background: isActive ? "var(--brand-rose)" : "transparent",
                            color: isActive ? "#ffffff" : "#a3a3a3",
                            textDecoration: "none",
                          }}
                        >
                          <Icon size={15} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "10px", borderTop: "1px solid #262626", background: "#121212", display: "flex", flexDirection: "column", gap: "5px" }}>
              <Link href="/" target="_blank" style={{ padding: "7px", background: "#262626", color: "#fff", borderRadius: "4px", textAlign: "center", fontSize: "11px", fontWeight: "600", textDecoration: "none" }}>
                View Storefront ↗
              </Link>
              <button type="button" onClick={handleLogout} style={{ padding: "7px", background: "#1c0404", color: "#f87171", border: "1px solid #450a0a", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT COLUMN */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* TOP COMMAND HEADER */}
        <header
          style={{
            minHeight: "56px",
            flexShrink: 0,
            background: "#fff",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 24px",
            zIndex: 30,
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={toggleSidebar}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                background: "#fff",
                cursor: "pointer",
                color: "var(--color-noir)",
              }}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label="Toggle sidebar"
            >
              <MenuIcon size={16} />
            </button>

            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-noir)" }}>
                {title || "Command Hub"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isMaintenanceOn && (
              <Link
                href="/admin/settings"
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  border: "1px solid #f87171",
                  padding: "4px 10px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  boxShadow: "0 0 10px rgba(239, 68, 68, 0.2)",
                  animation: "pulse 2s infinite",
                }}
                title="Click to turn off Maintenance Mode in Settings"
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }} />
                <span>MAINTENANCE MODE ON</span>
              </Link>
            )}
            {actions}
          </div>
        </header>

        {/* WORKSPACE SCROLLABLE BODY */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "auto",
            padding: "24px 28px 60px",
            width: "100%",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
