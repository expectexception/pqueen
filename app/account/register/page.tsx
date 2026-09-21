"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { SparklesIcon, ArrowRightIcon, ShieldCheckIcon, CloseIcon, LockIcon, MailIcon, UserIcon, PhoneIcon } from "@/app/components/Icons";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import OtpInput from "@/app/components/OtpInput";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { register, sendOtp, resendOtp } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Form details, Step 2: OTP verification
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [maskedDestination, setMaskedDestination] = useState("");
  const [error, setError] = useState("");

  // Step 1: Validate Form & Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanName = form.name.trim();

    if (!cleanName || !cleanEmail || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSendingOtp(true);

    const res = await sendOtp(cleanEmail, "REGISTER", cleanName);
    setSendingOtp(false);

    if (res.success) {
      setStep(2);
      setMaskedDestination(res.maskedDestination || cleanEmail);
      setOtpTimer(res.cooldownSeconds || 45);
      showToast(res.message || `6-digit verification code dispatched to ${cleanEmail}`, { type: "success" });
    } else {
      setError(res.error || "Failed to dispatch verification code.");
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    setError("");
    setSendingOtp(true);

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanName = form.name.trim();

    const res = await resendOtp(cleanEmail, "REGISTER", cleanName);
    setSendingOtp(false);

    if (res.success) {
      setMaskedDestination(res.maskedDestination || cleanEmail);
      setOtpTimer(res.cooldownSeconds || 45);
      showToast("Fresh 6-digit verification code dispatched!", { type: "success" });
    } else {
      setError(res.error || "Failed to resend verification code.");
    }
  }

  // Step 2: Verify OTP & Complete Registration
  async function handleVerifyAndRegister(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    const res = await register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      password: form.password,
      otp: otp.trim(),
    });

    setLoading(false);

    if (res.success) {
      showToast("Account verified & created successfully! Welcome to PQN Party Queen.", { type: "success" });
      router.push("/account");
      router.refresh();
    } else {
      setError(res.error || "Registration failed.");
    }
  }

  return (
    <main className="section-wrapper" style={{ maxWidth: "520px", padding: "60px 20px 100px", margin: "0 auto" }}>
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
          PQN ATELIER MEMBERSHIP
        </span>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "var(--color-primary)", marginTop: "6px" }}>
          {step === 1 ? "Create Your Account" : "Verify Your Account"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "8px" }}>
          {step === 1
            ? "Join our haute couture circle for bespoke fittings & private bridal curations."
            : "Enter the 6-digit verification code sent to your registered email to complete setup."}
        </p>
      </div>

      {/* REGISTRATION CONTAINER */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "36px 32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
        }}
      >
        {/* STEP 1: REGISTRATION FORM */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Radhika Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={sendingOtp}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address (For Invoices & OTP) *</label>
              <input
                id="reg-email"
                type="email"
                required
                className="form-input"
                placeholder="e.g. radhika@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={sendingOtp}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Mobile Number (For Courier Tracking)</label>
              <input
                id="reg-phone"
                type="tel"
                className="form-input"
                placeholder="e.g. 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={sendingOtp}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password (Minimum 6 characters) *</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={sendingOtp}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-pass-confirm">Confirm Password *</label>
              <input
                id="reg-pass-confirm"
                type="password"
                required
                minLength={6}
                className="form-input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                disabled={sendingOtp}
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
              disabled={sendingOtp}
              style={{ width: "100%", padding: "14px", marginTop: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              {sendingOtp ? "DISPATCHING CODE..." : "CONTINUE & VERIFY WITH OTP"}
              <ArrowRightIcon size={15} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION FORM */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={() => handleVerifyAndRegister()}
              maskedDestination={maskedDestination}
              cooldownSeconds={otpTimer}
              onResend={handleResendOtp}
              resending={sendingOtp}
              onChangeDestination={() => {
                setStep(1);
                setOtp("");
                setError("");
              }}
              destinationLabel="Enter 6-Digit Verification Code"
              submitLabel="VERIFY & COMPLETE REGISTRATION"
              onSubmit={handleVerifyAndRegister}
              submitting={loading}
              error={error}
            />
          </form>
        )}

        {/* GOOGLE & SOCIAL LOGIN DIVIDER */}
        {step === 1 && (
          <>
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
          </>
        )}

        {/* REDIRECT TO LOGIN */}
        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "var(--color-text-muted)" }}>
          Already have a member profile?{" "}
          <Link href="/account/login" style={{ color: "#0d4428", fontWeight: "700", textDecoration: "underline" }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </main>
  );
}
