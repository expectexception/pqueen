"use client";

import React from "react";
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
} from "@/app/components/Icons";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  }

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Products", href: "/admin/products" },
    { label: "Categories", href: "/admin/categories" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Settings", href: "/admin/settings" },
  ];

  return (
    <header
      style={{
        background: "var(--color-noir)",
        color: "#fff",
        borderBottom: "1px solid #292524",
        padding: "0 28px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link
          href="/admin"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "17px",
            letterSpacing: "1.5px",
            color: "#fff",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheckIcon size={20} className="text-pink-400" />
          <span>PQN ADMIN</span>
        </Link>

        <nav style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                  color: isActive ? "#fff" : "#a8a29e",
                  transition: "all 0.15s ease",
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/admin/products/new"
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              padding: "5px 10px",
              marginLeft: "6px",
              borderRadius: "4px",
              background: "var(--brand-rose)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <PlusIcon size={13} /> Add Product
          </Link>
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link
          href="/"
          target="_blank"
          style={{
            fontSize: "12px",
            color: "#d6d3d1",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <EyeIcon size={15} />
          <span>View Live Store</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "4px",
            border: "1px solid #7f1d1d",
          }}
        >
          <LogOutIcon size={13} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
