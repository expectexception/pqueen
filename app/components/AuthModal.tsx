"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import {
  CloseIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  PhoneIcon,
  KeyIcon,
} from "@/app/components/Icons";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register" | "otp-login";
  onSuccess?: (user: any) => void;
  title?: string;
  subtitle?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
  title,
  subtitle,
}: AuthModalProps) {
  const { user, login, register, loginWithOtp, sendOtp } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"login" | "register">(
    initialMode === "register" ? "register" : "login"
  );
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">(
    initialMode === "otp-login" ? "otp" : "otp"
  );

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginCountdown, setLoginCountdown] = useState(0);

  // Register States
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regCountdown, setRegCountdown] = useState(0);

  // Forgot Password States
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotCountdown, setForgotCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync initial mode
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode === "register" ? "register" : "login");
      if (initialMode === "otp-login") {
        setLoginMethod("otp");
      }
      setError("");
    }
  }, [isOpen, initialMode]);

  // Timers
  useEffect(() => {
    if (loginCountdown <= 0) return;
    const t = setInterval(() => setLoginCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [loginCountdown]);

  useEffect(() => {
    if (regCountdown <= 0) return;
    const t = setInterval(() => setRegCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [regCountdown]);

  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const t = setInterval(() => setForgotCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [forgotCountdown]);

  if (!isOpen) return null;

  // 1. LOGIN WITH OTP (Supports Mobile Phone Number or Email)
  async function handleSendLoginOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError("");
    const raw = loginEmail.trim();
    if (!raw) {
      setError("Please enter your 10-digit mobile number or email address.");
      return;
    }
    if (!raw.includes("@")) {
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await sendOtp(raw, "LOGIN");
      if (!res.success) {
        setError(res.error || "Failed to send OTP.");
        return;
      }
      setLoginOtpSent(true);
      setLoginCountdown(60);
      showToast(`Verification code dispatched for ${raw}`, { type: "success" });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyLoginOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const raw = loginEmail.trim();
    const otp = loginOtp.trim();

    if (!otp || otp.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginWithOtp(raw, otp);
      if (!res.success) {
        setError(res.error || "Invalid OTP code.");
        return;
      }
      showToast("Signed in successfully!", { type: "success" });
      onSuccess?.(res);
      onClose();
    } catch {
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // 2. LOGIN WITH PASSWORD
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const email = loginEmail.trim().toLowerCase();
    if (!email || !loginPassword) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, loginPassword);
      if (!res.success) {
        setError(res.error || "Invalid credentials.");
        return;
      }
      showToast("Signed in successfully!", { type: "success" });
      onSuccess?.(res);
      onClose();
    } catch {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  // 3. REGISTER STEP 1: SEND OTP
  async function handleSendRegOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!regName.trim()) {
      setError("Full Name is required.");
      return;
    }
    const email = regEmail.trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(email, "SIGNUP", regName.trim());
      if (!res.success) {
        setError(res.error || "Failed to send verification code.");
        return;
      }
      setRegStep(2);
      setRegCountdown(60);
      showToast(`Verification code sent to ${email}`, { type: "success" });
    } catch {
      setError("Unable to dispatch verification code.");
    } finally {
      setLoading(false);
    }
  }

  // 4. REGISTER STEP 2: VERIFY OTP & CREATE ACCOUNT
  async function handleVerifyRegOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const email = regEmail.trim().toLowerCase();
    const otp = regOtp.trim();

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        name: regName.trim(),
        email,
        password: regPassword,
        phone: regPhone.trim() || undefined,
        otp,
      });
      if (!res.success) {
        setError(res.error || "Registration failed.");
        return;
      }
      showToast("Account created and verified successfully!", { type: "success" });
      onSuccess?.(res);
      onClose();
    } catch {
      setError("Registration could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  // 5. FORGOT PASSWORD
  async function handleSendForgotOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const email = forgotEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp(email, "FORGOT_PASSWORD");
      if (!res.success) {
        setError(res.error || "Failed to send reset code.");
        return;
      }
      setForgotStep(2);
      setForgotCountdown(60);
      showToast(`Reset code sent to ${email}`, { type: "success" });
    } catch {
      setError("Could not send password reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const email = forgotEmail.trim().toLowerCase();
    const otp = forgotOtp.trim();

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: forgotNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }
      showToast("Password updated! You are now signed in.", { type: "success" });
      setForgotModal(false);
      onSuccess?.(data);
      onClose();
    } catch {
      setError("Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#0b3320] border border-[#f5d77f]/30 rounded-2xl shadow-2xl overflow-hidden text-[#f6f8f6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-[#f6f8f6]/70 hover:text-[#f5d77f] hover:bg-white/5 rounded-full transition-colors z-10"
          aria-label="Close modal"
        >
          <CloseIcon size={20} />
        </button>

        <div className="p-6 md:p-8">
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5d77f]/10 border border-[#f5d77f]/20 text-[#f5d77f] text-xs uppercase tracking-widest font-medium mb-3">
              <SparklesIcon size={13} />
              <span>PQN Luxury Atelier</span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-[#f5d77f] font-normal tracking-wide">
              {title || (activeTab === "login" ? "Sign In to Your Account" : "Create PQN Account")}
            </h2>
            <p className="text-xs md:text-sm text-[#f6f8f6]/70 mt-1.5">
              {subtitle ||
                "Verify your email with instant OTP for seamless checkout & order tracking."}
            </p>
          </div>

          {/* Navigation Tabs */}
          {!forgotModal && (
            <div className="flex border-b border-[#f5d77f]/20 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-all relative ${
                  activeTab === "login"
                    ? "text-[#f5d77f] font-semibold"
                    : "text-[#f6f8f6]/50 hover:text-[#f6f8f6]/80"
                }`}
              >
                Sign In
                {activeTab === "login" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5d77f]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setError("");
                }}
                className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-medium transition-all relative ${
                  activeTab === "register"
                    ? "text-[#f5d77f] font-semibold"
                    : "text-[#f6f8f6]/50 hover:text-[#f6f8f6]/80"
                }`}
              >
                New Customer
                {activeTab === "register" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5d77f]" />
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <ShieldCheckIcon size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FORGOT PASSWORD MODAL VIEW */}
          {forgotModal ? (
            <div>
              <div className="text-center mb-4">
                <span className="text-xs uppercase tracking-widest text-[#f5d77f] font-medium">
                  Password Recovery
                </span>
                <p className="text-xs text-[#f6f8f6]/60 mt-1">
                  {forgotStep === 1
                    ? "Enter your email to receive a 6-digit security code."
                    : `Enter the 6-digit code sent to ${forgotEmail}`}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleSendForgotOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <MailIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotModal(false);
                      setForgotStep(1);
                      setError("");
                    }}
                    className="w-full py-2 text-center text-xs text-[#f6f8f6]/60 hover:text-[#f5d77f] transition-colors"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      6-Digit Security Code
                    </label>
                    <div className="relative">
                      <KeyIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <LockIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="password"
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      disabled={forgotCountdown > 0 || loading}
                      onClick={handleSendForgotOtp}
                      className="text-[#f5d77f] hover:underline disabled:opacity-50"
                    >
                      {forgotCountdown > 0 ? `Resend code in ${forgotCountdown}s` : "Resend Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[#f6f8f6]/60 hover:text-[#f5d77f]"
                    >
                      Change Email
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? "UPDATING..." : "RESET & SIGN IN"}
                  </button>
                </form>
              )}
            </div>
          ) : activeTab === "login" ? (
            /* TAB 1: SIGN IN */
            <div>
              {/* Method Switcher */}
              <div className="flex bg-[#072818] p-1 rounded-lg border border-[#f5d77f]/20 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("otp");
                    setError("");
                  }}
                  className={`flex-1 py-1.5 text-[11px] uppercase tracking-wider rounded-md font-medium transition-all ${
                    loginMethod === "otp"
                      ? "bg-[#f5d77f] text-[#072818] font-bold shadow-sm"
                      : "text-[#f6f8f6]/60 hover:text-[#f6f8f6]"
                  }`}
                >
                  One-Time OTP (Instant)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("password");
                    setError("");
                  }}
                  className={`flex-1 py-1.5 text-[11px] uppercase tracking-wider rounded-md font-medium transition-all ${
                    loginMethod === "password"
                      ? "bg-[#f5d77f] text-[#072818] font-bold shadow-sm"
                      : "text-[#f6f8f6]/60 hover:text-[#f6f8f6]"
                  }`}
                >
                  Password
                </button>
              </div>

              {loginMethod === "otp" ? (
                /* OTP LOGIN */
                !loginOtpSent ? (
                  <form onSubmit={handleSendLoginOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                        Mobile Number (or Email Address)
                      </label>
                      <div className="relative">
                        <PhoneIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                        <input
                          type="text"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="e.g. 98765 43210 or you@domain.com"
                          className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {loading ? "SENDING CODE..." : "GET ONE-TIME OTP"}
                      <ArrowRightIcon size={15} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                    <div className="p-3 bg-[#072818]/60 border border-[#f5d77f]/20 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-[#f6f8f6]/70 truncate max-w-[200px]">{loginEmail}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginOtpSent(false);
                          setLoginOtp("");
                        }}
                        className="text-[#f5d77f] hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                        Enter 6-Digit Code
                      </label>
                      <div className="relative">
                        <KeyIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={loginOtp}
                          onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          autoFocus
                          className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <button
                        type="button"
                        disabled={loginCountdown > 0 || loading}
                        onClick={handleSendLoginOtp}
                        className="text-[#f5d77f] hover:underline disabled:opacity-50"
                      >
                        {loginCountdown > 0 ? `Resend code in ${loginCountdown}s` : "Resend OTP"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {loading ? "VERIFYING..." : "VERIFY & SIGN IN"}
                      <CheckIcon size={16} />
                    </button>
                  </form>
                )
              ) : (
                /* PASSWORD LOGIN */
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <MailIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setForgotModal(true);
                          setError("");
                        }}
                        className="text-[11px] text-[#f5d77f] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <LockIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? "SIGNING IN..." : "SIGN IN WITH PASSWORD"}
                    <ArrowRightIcon size={15} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* TAB 2: CREATE ACCOUNT (WITH OTP) */
            <div>
              {regStep === 1 ? (
                <form onSubmit={handleSendRegOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Radhika Sharma"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <MailIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <PhoneIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Create Password *
                    </label>
                    <div className="relative">
                      <LockIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-4"
                  >
                    {loading ? "SENDING VERIFICATION..." : "CONTINUE & VERIFY EMAIL"}
                    <ArrowRightIcon size={15} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyRegOtp} className="space-y-4">
                  <div className="p-3 bg-[#072818]/60 border border-[#f5d77f]/20 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-[#f5d77f]">{regName}</div>
                      <div className="text-[#f6f8f6]/70 truncate max-w-[200px]">{regEmail}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegStep(1)}
                      className="text-[#f5d77f] hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#f5d77f]/80 mb-1">
                      Enter 6-Digit Email Code *
                    </label>
                    <div className="relative">
                      <KeyIcon size={16} className="absolute left-3.5 top-3.5 text-[#f5d77f]/50" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        autoFocus
                        className="w-full bg-[#072818] border border-[#f5d77f]/30 rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-[#f6f8f6] placeholder:text-[#f6f8f6]/30 focus:border-[#f5d77f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      disabled={regCountdown > 0 || loading}
                      onClick={handleSendRegOtp}
                      className="text-[#f5d77f] hover:underline disabled:opacity-50"
                    >
                      {regCountdown > 0 ? `Resend code in ${regCountdown}s` : "Resend Verification Code"}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#cda84e] via-[#f5d77f] to-[#cda84e] text-[#072818] text-xs uppercase tracking-widest font-semibold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? "CREATING ACCOUNT..." : "VERIFY & COMPLETE REGISTRATION"}
                    <CheckIcon size={16} />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Social Sign-In Divider */}
          {!forgotModal && (
            <div className="mt-6 pt-5 border-t border-[#f5d77f]/15">
              <div className="relative flex items-center justify-center mb-4">
                <span className="bg-[#0b3320] px-3 text-[11px] uppercase tracking-wider text-[#f6f8f6]/40">
                  Or Continue With
                </span>
              </div>

              <a
                href="/api/auth/google"
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-[#f5d77f]/25 rounded-lg text-xs tracking-wider text-[#f6f8f6] flex items-center justify-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Instant Account Access</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
