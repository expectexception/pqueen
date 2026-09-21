"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SparklesIcon, WhatsAppIcon, ShieldCheckIcon, LockIcon } from "@/app/components/Icons";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState<{
    enabled: boolean;
    title: string;
    message: string;
    estimatedReopenTime: string;
    emergencyWhatsApp: string;
  } | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin routes and APIs are always 100% accessible
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  useEffect(() => {
    // Admin routes bypass check immediately
    if (isAdminRoute) {
      setLoading(false);
      return;
    }

    async function checkMaintenance() {
      try {
        // Check if admin session cookie is present
        const hasAdminCookie = document.cookie.includes("pqn_admin_session");
        setIsAdminLoggedIn(hasAdminCookie);

        const res = await fetch("/api/settings/public", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.maintenanceMode) {
            setMaintenance(data.maintenanceMode);
          }
        }
      } catch (err) {
        console.warn("Failed to check maintenance mode status:", err);
      } finally {
        setLoading(false);
      }
    }

    checkMaintenance();
  }, [pathname, isAdminRoute]);

  // If navigating admin routes, always allow normal render
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // If maintenance mode is active
  if (!loading && maintenance?.enabled) {
    // If admin is logged in, show top notification banner and let admin preview storefront
    if (isAdminLoggedIn) {
      return (
        <>
          <div
            style={{
              background: "linear-gradient(90deg, #78350f, #92400e)",
              color: "#fef3c7",
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "12.5px",
              fontWeight: "700",
              position: "sticky",
              top: 0,
              zIndex: 99999,
              borderBottom: "1px solid #f59e0b",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheckIcon size={16} />
              <span>✦ MAINTENANCE MODE ACTIVE: Storefront is hidden from public patrons. You are previewing with Admin bypass.</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Link
                href="/admin/settings"
                style={{
                  background: "#fef3c7",
                  color: "#78350f",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontSize: "11.5px",
                  fontWeight: "800",
                }}
              >
                ⚙️ Turn OFF in Settings
              </Link>
            </div>
          </div>
          {children}
        </>
      );
    }

    // For public visitors: render the Haute Couture Maintenance Screen
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at 50% 30%, #0d4428 0%, #072818 60%, #03140c 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        {/* Subtle Background Shimmer Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(197, 155, 39, 0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "680px",
            width: "100%",
            background: "rgba(7, 40, 24, 0.75)",
            border: "1.5px solid rgba(197, 155, 39, 0.45)",
            borderRadius: "16px",
            padding: "48px 36px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* LOGO */}
          <div style={{ marginBottom: "28px" }}>
            <img
              src="/logo-gold.png?v=3"
              alt="PQN PARTY QUEEN"
              style={{
                height: "90px",
                width: "auto",
                objectFit: "contain",
                margin: "0 auto",
                display: "block",
                filter: "drop-shadow(0 4px 16px rgba(197, 155, 39, 0.3))",
              }}
            />
          </div>

          {/* STATUS PILL */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(197, 155, 39, 0.15)",
              border: "1px solid rgba(197, 155, 39, 0.5)",
              borderRadius: "20px",
              padding: "6px 16px",
              color: "#f5d77f",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            <SparklesIcon size={14} />
            <span>ATELIER PRIVATE CURATION & RUNWAY PREPARATION</span>
          </div>

          {/* TITLE */}
          <h1
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: "400",
              color: "#ffffff",
              marginBottom: "16px",
              lineHeight: 1.2,
            }}
          >
            {maintenance.title || "Curating Our Next Haute Couture Collection"}
          </h1>

          {/* MESSAGE */}
          <p
            style={{
              color: "#d1d5db",
              fontSize: "15px",
              lineHeight: "1.7",
              marginBottom: "28px",
              maxWidth: "540px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {maintenance.message ||
              "Our digital atelier is currently undergoing curated runway updates. We are preparing our newest Haute Couture bridal & festive collections and will reopen shortly."}
          </p>

          {/* ESTIMATED REOPENING TIME */}
          {maintenance.estimatedReopenTime && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                padding: "12px 20px",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                color: "#f5d77f",
                fontSize: "13px",
                fontWeight: "700",
                marginBottom: "32px",
              }}
            >
              <span>⏱️ Expected Reopening:</span>
              <strong style={{ color: "#ffffff" }}>{maintenance.estimatedReopenTime}</strong>
            </div>
          )}

          {/* VIP WHATSAPP ACTION */}
          <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
            <a
              href={`https://wa.me/${(maintenance.emergencyWhatsApp || "919876543210").replace(/[^0-9]/g, "")}?text=Hello%20PQN%20Styling%20Team,%20I%20have%20an%20urgent%20inquiry%20regarding%20haute%20couture%20ensembles.`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#15803d",
                color: "#ffffff",
                padding: "14px 28px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "1px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 16px rgba(21, 128, 61, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              <WhatsAppIcon size={18} />
              <span>CONNECT WITH VIP STYLIST</span>
            </a>
          </div>

          {/* DISCREET ADMIN LOGIN */}
          <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link
              href="/admin/login"
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "12px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#f5d77f")}
              onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)")}
            >
              <LockIcon size={12} />
              <span>Admin &amp; Staff Portal Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
