"use client";

import React, { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./login.css";
import { ShieldCheckIcon, CloseIcon, CheckIcon, LockIcon } from "@/app/components/Icons";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpTimer, setResetOtpTimer] = useState(0);
  const [resetSendingOtp, setResetSendingOtp] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resetOtpTimer > 0) {
      interval = setInterval(() => setResetOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resetOtpTimer]);

  // Standard Admin Login
  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      router.push("/admin/orders");
      router.refresh();
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);
      setError("Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Send OTP for Admin Password Reset
  async function handleSendAdminOtp() {
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setResetError("Please enter a valid administrator email address.");
      return;
    }
    setResetError("");
    setResetSendingOtp(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          purpose: "ADMIN_FORGOT_PASSWORD",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch administrator security code.");
      }

      setResetOtpSent(true);
      setResetOtpTimer(60);
    } catch (err: any) {
      setResetError(err.message || "Failed to send security code.");
    } finally {
      setResetSendingOtp(false);
    }
  }

  // Reset Admin Password with OTP
  async function handleAdminResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");

    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError("Please enter the 6-digit security verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset admin password.");
      }

      setResetSuccess(true);

      setTimeout(() => {
        setIsResetModalOpen(false);
        router.push("/admin/orders");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset admin password.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "var(--brand-rose-light)",
              color: "var(--brand-rose)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <ShieldCheckIcon size={24} />
          </div>
        </div>

        <div className="admin-login-header">
          <p className="admin-login-eyebrow">PQN PARTY QUEEN</p>
          <h1>Admin Portal</h1>
          <p>Sign in to manage catalog, orders, and fulfillment.</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pqnpartyqueen.com"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-login-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label htmlFor="admin-password" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email || "P4RTYqueen@gmail.com");
                  setResetError("");
                  setResetSuccess(false);
                  setResetOtpSent(false);
                  setResetOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsResetModalOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "11.5px",
                  color: "#c59b27",
                  cursor: "pointer",
                  fontWeight: "700",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="admin-login-error">{error}</p>}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN TO DASHBOARD"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              fontSize: "12px",
              color: "var(--color-text-muted)",
              textDecoration: "underline",
            }}
          >
            ← Return to Store Front
          </Link>
        </div>
      </div>

      {/* ADMIN FORGOT PASSWORD MODAL WITH OTP VERIFICATION */}
      {isResetModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(7, 40, 24, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              overflow: "hidden",
              border: "1.5px solid #c59b27",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "2px solid #c59b27",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "2px", color: "#f5d77f", textTransform: "uppercase" }}>
                  🛡️ ADMIN SECURITY PASSCODE
                </span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", margin: "2px 0 0", color: "#ffffff" }}>
                  Reset Admin Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                style={{ background: "none", border: "none", color: "#f5d77f", cursor: "pointer" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminResetSubmit} style={{ padding: "24px" }}>
              {resetError && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "4px", fontSize: "12.5px", marginBottom: "16px" }}>
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: "4px", fontSize: "12.5px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckIcon size={16} /> Admin password updated! Authenticating session...
                </div>
              )}

              {/* STEP 1: ADMIN EMAIL & SEND OTP */}
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block", color: "#072818" }}>
                  Administrator Email *
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (resetOtpSent) setResetOtpSent(false);
                    }}
                    placeholder="admin@pqnpartyqueen.com"
                    className="form-input"
                    disabled={resetLoading || resetSendingOtp}
                    style={{ flex: 1, height: "40px", fontSize: "13.5px" }}
                  />
                  <button
                    type="button"
                    onClick={handleSendAdminOtp}
                    disabled={resetSendingOtp || resetOtpTimer > 0 || !resetEmail}
                    style={{
                      padding: "0 14px",
                      background: resetOtpTimer > 0 ? "#e2e8f0" : "#072818",
                      color: resetOtpTimer > 0 ? "#64748b" : "#f5d77f",
                      border: "1px solid #c59b27",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "800",
                      cursor: resetOtpTimer > 0 ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resetSendingOtp ? "Sending..." : resetOtpTimer > 0 ? `Resend (${resetOtpTimer}s)` : resetOtpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </div>

              {/* STEP 2: 6-DIGIT OTP + NEW PASSWORD */}
              {resetOtpSent && (
                <>
                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block", color: "#072818" }}>
                      6-Digit Security Passcode (OTP) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 849201"
                      className="form-input"
                      style={{
                        letterSpacing: "6px",
                        fontSize: "18px",
                        fontWeight: "800",
                        textAlign: "center",
                        fontFamily: "monospace",
                        height: "42px",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                      Security code sent to {resetEmail}. Valid for 10 minutes.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block", color: "#072818" }}>
                      New Admin Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new master password"
                      className="form-input"
                      style={{ width: "100%", height: "40px", fontSize: "13.5px" }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "22px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block", color: "#072818" }}>
                      Confirm New Admin Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new master password"
                      className="form-input"
                      style={{ width: "100%", height: "40px", fontSize: "13.5px" }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  style={{
                    padding: "10px 18px",
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
                  type="submit"
                  disabled={resetLoading || resetSuccess || !resetOtpSent || resetOtp.length !== 6}
                  style={{
                    padding: "10px 22px",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
                    color: "#f5d77f",
                    border: "1px solid #c59b27",
                    borderRadius: "4px",
                    cursor: !resetOtpSent || resetOtp.length !== 6 ? "not-allowed" : "pointer",
                    opacity: !resetOtpSent || resetOtp.length !== 6 ? 0.6 : 1,
                  }}
                >
                  {resetLoading ? "VERIFYING & UPDATING..." : "VERIFY OTP & RESET ADMIN ACCESS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}