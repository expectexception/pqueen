"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Link from "next/link";
import { CheckIcon, CloseIcon, BagIcon, HeartIcon } from "@/app/components/Icons";

export type ToastType = "success" | "cart" | "wishlist" | "info" | "error";

export type Toast = {
  id: string;
  message: string;
  type?: ToastType;
  action?: {
    label: string;
    href: string;
  };
};

type ToastContextType = {
  showToast: (message: string, options?: { type?: ToastType; action?: { label: string; href: string }; duration?: number }) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      options?: { type?: ToastType; action?: { label: string; href: string }; duration?: number }
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: Toast = {
        id,
        message,
        type: options?.type || "success",
        action: options?.action,
      };

      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

      const duration = options?.duration || 3500;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type || "success"}`}>
            <div className="toast-icon">
              {toast.type === "cart" ? (
                <BagIcon size={18} />
              ) : toast.type === "wishlist" ? (
                <HeartIcon size={18} filled={true} />
              ) : (
                <CheckIcon size={18} />
              )}
            </div>
            <div className="toast-content">
              <p className="toast-message">{toast.message}</p>
              {toast.action && (
                <Link href={toast.action.href} className="toast-action" onClick={() => removeToast(toast.id)}>
                  {toast.action.label} →
                </Link>
              )}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
