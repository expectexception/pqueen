"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  InstagramIcon,
  FacebookIcon,
  WhatsAppIcon,
  PinterestIcon,
  YouTubeIcon,
  TwitterIcon,
} from "@/app/components/Icons";

const defaultSocials = {
  instagram: {
    enabled: true,
    url: "https://instagram.com/pqnpartyqueen",
    handle: "Instagram",
  },
  facebook: {
    enabled: true,
    url: "https://facebook.com/pqnpartyqueen",
    handle: "Facebook",
  },
  whatsapp: {
    enabled: true,
    url: "https://wa.me/919876543210",
    handle: "WhatsApp Concierge",
  },
  pinterest: {
    enabled: true,
    url: "https://pinterest.com/pqnpartyqueen",
    handle: "Pinterest",
  },
  youtube: {
    enabled: false,
    url: "https://youtube.com/@pqnpartyqueen",
    handle: "YouTube",
  },
  twitter: {
    enabled: false,
    url: "https://x.com/pqnpartyqueen",
    handle: "X (Twitter)",
  },
};

export default function Footer() {
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any>(defaultSocials);

  // Fetch live configured social media channels from store settings
  useEffect(() => {
    async function loadSocialLinks() {
      try {
        const res = await fetch("/api/settings/public");
        if (res.ok) {
          const data = await res.json();
          if (data.socialLinks) {
            setSocialLinks(data.socialLinks);
          }
        }
      } catch (err) {
        console.warn("Using default social links:", err);
      }
    }
    loadSocialLinks();
  }, []);

  // Hide footer in admin dashboard views
  if (pathname.startsWith("/admin")) {
    return null;
  }

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSubscribed(false), 4000);
  }

  const socialItems = [
    { key: "instagram", label: "Instagram", icon: <InstagramIcon size={16} />, data: socialLinks?.instagram },
    { key: "facebook", label: "Facebook", icon: <FacebookIcon size={16} />, data: socialLinks?.facebook },
    { key: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon size={16} />, data: socialLinks?.whatsapp },
    { key: "pinterest", label: "Pinterest", icon: <PinterestIcon size={16} />, data: socialLinks?.pinterest },
    { key: "youtube", label: "YouTube", icon: <YouTubeIcon size={16} />, data: socialLinks?.youtube },
    { key: "twitter", label: "X (Twitter)", icon: <TwitterIcon size={16} />, data: socialLinks?.twitter },
  ].filter((item) => item.data?.enabled !== false && item.data?.url);

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand Col */}
        <div className="footer-brand">
          <Link href="/" style={{ display: "inline-block", marginBottom: "16px" }}>
            <img
              src="/logo-gold.png?v=3"
              alt="PQN PARTY QUEEN"
              style={{
                height: "72px",
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Link>
          <p>
            Elevating women’s festive couture &amp; luxury bridal fashion. Crafted with passion, elegance, and timeless grace for your most celebrated memories.
          </p>

          {/* LUXURY SOCIAL MEDIA BADGES SECTION */}
          <div style={{ marginTop: "24px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", color: "#c59b27", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>
              Join Our Atelier Community:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              {socialItems.map((item) => (
                <a
                  key={item.key}
                  href={item.data?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    background: "rgba(13, 68, 40, 0.45)",
                    border: "1px solid rgba(197, 155, 39, 0.4)",
                    color: "#f5d77f",
                    fontSize: "12px",
                    fontWeight: "700",
                    textDecoration: "none",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    backdropFilter: "blur(6px)",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#0d4428";
                    e.currentTarget.style.borderColor = "#c59b27";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(197, 155, 39, 0.25)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(13, 68, 40, 0.45)";
                    e.currentTarget.style.borderColor = "rgba(197, 155, 39, 0.4)";
                    e.currentTarget.style.color = "#f5d77f";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Shop Col */}
        <div className="footer-col">
          <h4>Collections</h4>
          <div className="footer-links">
            <Link href="/shop">All Styles</Link>
            <Link href="/shop?category=lehengas">Designer Lehengas</Link>
            <Link href="/shop?category=suit-sets">Suit Sets</Link>
            <Link href="/shop?category=dresses">Party Dresses</Link>
            <Link href="/shop?category=sarees">Sarees</Link>
            <Link href="/shop?filter=new">New Arrivals</Link>
          </div>
        </div>

        {/* Customer Care Col */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <div className="footer-links">
            <Link href="/track-order">Track Your Order</Link>
            <Link href="/shipping">Shipping Information</Link>
            <Link href="/returns">Returns &amp; Exchanges</Link>
            <Link href="/helpdesk">Client Helpdesk</Link>
            <Link href="/faq">Frequently Asked Questions</Link>
            <Link href="/contact">Contact Support</Link>
          </div>
        </div>

        {/* VIP Newsletter Col */}
        <div className="footer-col">
          <h4>Join The VIP Circle</h4>
          <p style={{ color: "#a8a29e", fontSize: "13px", lineHeight: "1.6" }}>
            Receive private preview invites, secret discounts, and festive collection lookbooks.
          </p>
          {newsletterSubscribed ? (
            <div style={{ background: "rgba(13,68,40,0.6)", border: "1px solid #c59b27", borderRadius: "4px", padding: "10px 14px", color: "#f5d77f", fontSize: "12.5px", marginTop: "12px", fontWeight: "700" }}>
              ✓ Welcome to the VIP Circle!
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Your email address..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit">JOIN</button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Bottom with Powered by expectexception.com */}
      <div className="footer-bottom">
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ margin: 0 }}>© 2026 PQN PARTY QUEEN. All rights reserved.</p>
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
            Powered by{" "}
            <a
              href="https://expectexception.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#f5d77f",
                fontWeight: "700",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#f5d77f")}
            >
              expectexception.com
            </a>
          </p>
        </div>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/admin/login" style={{ opacity: 0.5 }}>Admin Portal</Link>
        </div>
      </div>
    </footer>
  );
}
