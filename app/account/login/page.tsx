"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import {
  UserIcon,
  ArrowRightIcon,
  LockIcon,
  CloseIcon,
  CheckIcon,
  ShieldCheckIcon,
  MailIcon,
  SparklesIcon,
  PhoneIcon,
} from "@/app/components/Icons";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import OtpInput from "@/app/components/OtpInput";

export default function CustomerLoginPage() {
  const router = useRouter();
  const { login, loginWithOtp, sendOtp, resendOtp, resetPassword } = useAuth();
  const { showToast } = useToast();

  // Login Mode: "OTP" (Default) | "PASSWORD"
  const [loginMode, setLoginMode] = useState<"OTP" | "PASSWORD">("OTP");

  // Standard Password Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Login State
  const [otpLoginIdentifier, setOtpLoginIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [maskedOtpDestination, setMaskedOtpDestination] = useState("");

  // Forgot / Reset Password Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpTimer, setResetOtpTimer] = useState(0);
  const [resetMaskedDestination, setResetMaskedDestination] = useState("");
  const [resetSendingOtp, setResetSendingOtp] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle Standard Password Login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await login(email.trim(), password);

    if (res.success) {
      showToast("Welcome back to PQN Party Queen!", { type: "success" });
      router.push("/account");
      router.refresh();
    } else {
      setError(res.error || "Invalid email or password.");
      setLoading(false);
    }
  }

  // Send OTP for Instant Login
  async function handleSendLoginOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const raw = (otpLoginIdentifier || email).trim();
    if (!raw) {
      setError("Please enter your mobile number or email address.");
      return;
    }
    if (!raw.includes("@")) {
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }
    setError("");
    setSendingOtp(true);

    const res = await sendOtp(raw, "LOGIN");
    setSendingOtp(false);

    if (res.success) {
      setOtpSent(true);
      setMaskedOtpDestination(res.maskedDestination || raw);
      setOtpTimer(res.cooldownSeconds || 45);
      showToast(res.message || "6-digit OTP dispatched!", { type: "success" });
    } else {
      setError(res.error || "Failed to send verification code.");
    }
  }

  // Resend OTP for Instant Login
  async function handleResendLoginOtp() {
    setError("");
    setSendingOtp(true);
    const raw = (otpLoginIdentifier || email).trim();

    const res = await resendOtp(raw, "LOGIN");
    setSendingOtp(false);

    if (res.success) {
      setMaskedOtpDestination(res.maskedDestination || raw);
      setOtpTimer(res.cooldownSeconds || 45);
      showToast("Fresh 6-digit verification code dispatched!", { type: "success" });
    } else {
      setError(res.error || "Failed to resend verification code.");
    }
  }

  // Verify OTP & Sign In
  async function handleOtpLoginSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    const raw = (otpLoginIdentifier || email).trim();

    if (!raw) {
      setError("Mobile number or email address is required.");
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    const res = await loginWithOtp(raw, otpCode.trim());
    setLoading(false);

    if (res.success) {
      showToast("Verified! Welcome back to PQN Party Queen.", { type: "success" });
      router.push("/account");
      router.refresh();
    } else {
      setError(res.error || "Invalid verification code.");
    }
  }

  // Send OTP for Forgot Password
  async function handleSendResetOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const raw = resetIdentifier.trim();
    if (!raw) {
      setResetError("Please enter your registered email or mobile number.");
      return;
    }
    setResetError("");
    setResetSendingOtp(true);

    const res = await sendOtp(raw, "FORGOT_PASSWORD");
    setResetSendingOtp(false);

    if (res.success) {
      setResetOtpSent(true);
      setResetMaskedDestination(res.maskedDestination || raw);
      setResetOtpTimer(res.cooldownSeconds || 45);
      showToast(res.message || "6-digit security code dispatched!", { type: "success" });
    } else {
      setResetError(res.error || "Failed to send security code.");
    }
  }

  // Resend OTP for Forgot Password
  async function handleResendResetOtp() {
    setResetError("");
    setResetSendingOtp(true);
    const raw = resetIdentifier.trim();

    const res = await resendOtp(raw, "FORGOT_PASSWORD");
    setResetSendingOtp(false);

    if (res.success) {
      setResetMaskedDestination(res.maskedDestination || raw);
      setResetOtpTimer(res.cooldownSeconds || 45);
      showToast("Fresh 6-digit security code dispatched!", { type: "success" });
    } else {
      setResetError(res.error || "Failed to resend security code.");
    }
  }

  // Handle Reset Password with OTP Verification
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");

    if (!resetOtp || resetOtp.trim().length !== 6) {
      setResetError("Please enter the 6-digit verification code.");
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
    const res = await resetPassword({
      identifier: resetIdentifier.trim(),
      otp: resetOtp.trim(),
      newPassword,
    });
    setResetLoading(false);

    if (res.success) {
      setResetSuccess(true);
      showToast("Password updated successfully! Welcome back.", { type: "success" });
      setTimeout(() => {
        setIsResetModalOpen(false);
        router.push("/account");
        router.refresh();
      }, 1200);
    } else {
      setResetError(res.error || "Failed to reset password. Please verify the code.");
    }
  }

  return (
    <main className="section-wrapper" style={{ maxWidth: "480px", padding: "60px 20px 100px", margin: "0 auto" }}>
      <div className="section-heading" style={{ marginBottom: "32px", textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(13, 68, 40, 0.08)",
            color: "#0d4428",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}
        >
          <UserIcon size={26} />
        </div>
        <span className="section-subtitle" style={{ letterSpacing: "2px", color: "var(--brand-rose)" }}>
          PQN ATELIER CLIENT ACCESS
        </span>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "var(--color-primary)", marginTop: "6px" }}>
          Welcome Back
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "8px" }}>
          Access your bespoke sizing dossier, bridal lookbooks & couture order history.
        </p>
      </div>

      {/* LOGIN CARD */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "36px 32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
        }}
      >
        {/* LOGIN MODE SWITCHER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            background: "#f4f6f4",
            padding: "4px",
            borderRadius: "6px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setLoginMode("OTP");
              setError("");
              if (email && !otpLoginIdentifier) setOtpLoginIdentifier(email);
            }}
            style={{
              padding: "10px 12px",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              background: loginMode === "OTP" ? "#ffffff" : "transparent",
              color: loginMode === "OTP" ? "#072818" : "#64748b",
              boxShadow: loginMode === "OTP" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            Instant Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("PASSWORD");
              setError("");
            }}
            style={{
              padding: "10px 12px",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              background: loginMode === "PASSWORD" ? "#ffffff" : "transparent",
              color: loginMode === "PASSWORD" ? "#072818" : "#64748b",
              boxShadow: loginMode === "PASSWORD" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            Password Sign In
          </button>
        </div>

        {/* ONE-TIME OTP LOGIN FORM */}
        {loginMode === "OTP" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendLoginOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div className="form-group">
                  <label htmlFor="otp-customer-identifier">Mobile Number (or Email) *</label>
                  <input
                    id="otp-customer-identifier"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 98765 43210 or yourname@gmail.com"
                    value={otpLoginIdentifier}
                    onChange={(e) => setOtpLoginIdentifier(e.target.value)}
                    disabled={sendingOtp}
                    style={{ fontSize: "14px" }}
                  />
                  <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    Enter your 10-digit mobile number or registered email for instant 1-click login.
                  </span>
                </div>

                {error && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: "10px 14px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <ShieldCheckIcon size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sendingOtp}
                  style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                >
                  {sendingOtp ? "DISPATCHING CODE..." : "GET ONE-TIME OTP"}
                  <ArrowRightIcon size={15} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpLoginSubmit}>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={() => handleOtpLoginSubmit()}
                  maskedDestination={maskedOtpDestination}
                  cooldownSeconds={otpTimer}
                  onResend={handleResendLoginOtp}
                  resending={sendingOtp}
                  onChangeDestination={() => {
                    setOtpSent(false);
                    setOtpCode("");
                    setError("");
                  }}
                  destinationLabel="Enter 6-Digit Passcode"
                  submitLabel="VERIFY & SIGN IN"
                  onSubmit={handleOtpLoginSubmit}
                  submitting={loading}
                  error={error}
                />
              </form>
            )}
          </div>
        )}

        {/* PASSWORD LOGIN FORM */}
        {loginMode === "PASSWORD" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label htmlFor="customer-email">Email Address or Mobile Number *</label>
              <input
                id="customer-email"
                type="text"
                required
                className="form-input"
                placeholder="e.g. yourname@gmail.com or 9876543210"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label htmlFor="customer-password" style={{ margin: 0 }}>Password *</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetIdentifier(email);
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
                    fontSize: "12px",
                    color: "var(--brand-rose)",
                    cursor: "pointer",
                    fontWeight: "600",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="customer-password"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ShieldCheckIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "14px", marginTop: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN WITH PASSWORD"}
              <ArrowRightIcon size={15} />
            </button>
          </form>
        )}

        {/* GOOGLE QUICK ACCESS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "24px 0",
            color: "var(--color-text-muted)",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
          <span style={{ padding: "0 12px" }}>or quick access</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
        </div>

        <GoogleLoginButton />

        {/* REGISTRATION REDIRECT */}
        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "var(--color-text-muted)" }}>
          New to PQN Party Queen?{" "}
          <Link href="/account/register" style={{ color: "#0d4428", fontWeight: "700", textDecoration: "underline" }}>
            Create Member Account
          </Link>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isResetModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: "1px solid #c59b27",
              position: "relative",
            }}
          >
            <button
              onClick={() => setIsResetModalOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
              }}
            >
              <CloseIcon size={20} />
            </button>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(197, 155, 39, 0.12)",
                  color: "#072818",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px auto",
                }}
              >
                <LockIcon size={22} />
              </div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#072818", margin: 0 }}>
                Reset Member Password
              </h2>
              <p style={{ fontSize: "12.5px", color: "#6b7280", margin: "4px 0 0" }}>
                {resetOtpSent
                  ? "Enter the 6-digit code sent to your account to set a new password."
                  : "Enter your registered email or mobile number to receive a 6-digit OTP."}
              </p>
            </div>

            {resetError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <ShieldCheckIcon size={14} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                ✓ Password reset successfully! Redirecting...
              </div>
            )}

            {!resetOtpSent ? (
              <form onSubmit={handleSendResetOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label htmlFor="reset-identifier">Registered Email or Mobile *</label>
                  <input
                    id="reset-identifier"
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="e.g. yourname@gmail.com or 9876543210"
                    className="form-input"
                    disabled={resetSendingOtp}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
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
                    disabled={resetSendingOtp || !resetIdentifier}
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: "12px" }}
                  >
                    {resetSendingOtp ? "SENDING..." : "DISPATCH OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <OtpInput
                  value={resetOtp}
                  onChange={setResetOtp}
                  maskedDestination={resetMaskedDestination}
                  cooldownSeconds={resetOtpTimer}
                  onResend={handleResendResetOtp}
                  resending={resetSendingOtp}
                  onChangeDestination={() => {
                    setResetOtpSent(false);
                    setResetOtp("");
                    setResetError("");
                  }}
                  destinationLabel="6-Digit Verification Code"
                />

                <div className="form-group">
                  <label htmlFor="reset-new-password">New Password (Minimum 6 characters) *</label>
                  <input
                    id="reset-new-password"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reset-confirm-password">Confirm New Password *</label>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="form-input"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
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
                    disabled={resetLoading || resetSuccess || resetOtp.length !== 6}
                    className="btn-primary"
                    style={{ padding: "10px 22px", fontSize: "12px" }}
                  >
                    {resetLoading ? "VERIFYING & UPDATING..." : "VERIFY & RESET PASSWORD"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
