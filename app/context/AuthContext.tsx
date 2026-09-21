"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CustomerAddress = {
  id: string;
  tag: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

export type CustomerUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  googleId?: string | null;
  bustSize?: string | null;
  waistSize?: string | null;
  hipSize?: string | null;
  height?: string | null;
  addresses?: CustomerAddress[];
  createdAt?: string;
  orders?: any[];
};

type AuthContextType = {
  user: CustomerUser | null;
  loading: boolean;
  login: (identifierOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (identifierOrEmail: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; phone?: string; password: string; otp: string }) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (
    identifierOrEmail: string,
    purpose: string,
    name?: string,
    channel?: "EMAIL" | "SMS"
  ) => Promise<{ success: boolean; maskedDestination?: string; cooldownSeconds?: number; error?: string; message?: string }>;
  resendOtp: (
    identifierOrEmail: string,
    purpose: string,
    name?: string,
    channel?: "EMAIL" | "SMS"
  ) => Promise<{ success: boolean; maskedDestination?: string; cooldownSeconds?: number; error?: string; message?: string }>;
  resetPassword: (data: { identifier: string; otp: string; newPassword: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (data: Partial<CustomerUser> & { currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  async function sendOtp(
    identifierOrEmail: string,
    purpose: string,
    name?: string,
    channel?: "EMAIL" | "SMS"
  ) {
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifierOrEmail,
          email: identifierOrEmail,
          purpose,
          name,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to dispatch verification code.",
          cooldownSeconds: data.cooldownSeconds,
        };
      }
      return {
        success: true,
        maskedDestination: data.maskedDestination,
        cooldownSeconds: data.cooldownSeconds,
        message: data.message,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  }

  async function resendOtp(
    identifierOrEmail: string,
    purpose: string,
    name?: string,
    channel?: "EMAIL" | "SMS"
  ) {
    try {
      const res = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifierOrEmail,
          email: identifierOrEmail,
          purpose,
          name,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to resend verification code.",
          cooldownSeconds: data.cooldownSeconds,
        };
      }
      return {
        success: true,
        maskedDestination: data.maskedDestination,
        cooldownSeconds: data.cooldownSeconds,
        message: data.message,
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  }

  async function login(identifierOrEmail: string, password: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifierOrEmail, email: identifierOrEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async function loginWithOtp(identifierOrEmail: string, otp: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifierOrEmail, email: identifierOrEmail, otp, isOtpLogin: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Verification failed." };
      }

      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async function register(data: { name: string; email: string; phone?: string; password: string; otp: string }) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        return { success: false, error: resData.error || "Registration failed" };
      }

      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async function resetPassword(data: { identifier: string; otp: string; newPassword: string }) {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        return { success: false, error: resData.error || "Password reset failed." };
      }

      await refreshUser();
      return { success: true, message: resData.message };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async function updateProfile(data: Partial<CustomerUser> & { currentPassword?: string; newPassword?: string }) {
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        return { success: false, error: resData.error || "Failed to update profile" };
      }

      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithOtp,
        register,
        sendOtp,
        resendOtp,
        resetPassword,
        updateProfile,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
