"use client";

import React, { useRef, useEffect, useState } from "react";
import { ShieldCheckIcon, SparklesIcon, CheckIcon, ArrowRightIcon } from "@/app/components/Icons";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  error?: string;
  maskedDestination?: string;
  cooldownSeconds?: number;
  onResend?: () => void;
  resending?: boolean;
  onChangeDestination?: () => void;
  destinationLabel?: string;
  submitLabel?: string;
  onSubmit?: () => void;
  submitting?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  maskedDestination,
  cooldownSeconds = 0,
  onResend,
  resending = false,
  onChangeDestination,
  destinationLabel = "Verification Code",
  submitLabel = "Verify & Proceed",
  onSubmit,
  submitting = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(cooldownSeconds);

  // Sync timer when cooldownSeconds changes
  useEffect(() => {
    setTimer(cooldownSeconds);
  }, [cooldownSeconds]);

  // Countdown timer interval
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleDigitChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      // Clear current digit
      const nextDigits = [...digits];
      nextDigits[index] = "";
      const nextOtp = nextDigits.join("");
      onChange(nextOtp);
      return;
    }

    // Handle single digit entry
    const char = rawVal.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    const nextOtp = nextDigits.join("");
    onChange(nextOtp);

    // Auto advance to next box
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete if full OTP entered
    if (nextOtp.length === length && onComplete) {
      onComplete(nextOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Move back and delete previous
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasteData) return;

    onChange(pasteData);

    // Focus appropriate input
    const nextIndex = Math.min(pasteData.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex]?.focus();
    }

    if (pasteData.length === length && onComplete) {
      onComplete(pasteData);
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Destination Feedback Pill */}
      {maskedDestination && (
        <div
          style={{
            padding: "10px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12.5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534" }}>
            <CheckIcon size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>
              Code dispatched to <strong>{maskedDestination}</strong>
            </span>
          </div>
          {onChangeDestination && (
            <button
              type="button"
              onClick={onChangeDestination}
              style={{
                background: "none",
                border: "none",
                color: "#15803d",
                fontWeight: "700",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Change
            </button>
          )}
        </div>
      )}

      {/* 6 Luxury Input Boxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#374151" }}>
          {destinationLabel} *
        </label>
        <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
          {Array.from({ length }).map((_, idx) => {
            const isFilled = Boolean(digits[idx]);
            return (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digits[idx]}
                disabled={disabled || submitting}
                onChange={(e) => handleDigitChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: "100%",
                  maxWidth: "48px",
                  height: "54px",
                  textAlign: "center",
                  fontSize: "22px",
                  fontWeight: "800",
                  fontFamily: "monospace",
                  color: "#072818",
                  background: isFilled ? "#fbfdfc" : "#ffffff",
                  border: isFilled ? "2px solid #072818" : error ? "2px solid #ef4444" : "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  outline: "none",
                  boxShadow: isFilled ? "0 2px 8px rgba(7, 40, 24, 0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              />
            );
          })}
        </div>
        <span style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
          Enter the 6-digit code. Valid for 5 minutes.
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#991b1b",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheckIcon size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Resend & Timer Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
        <span style={{ color: "#6b7280" }}>Didn't receive code?</span>
        {onResend && (
          <button
            type="button"
            disabled={timer > 0 || resending || disabled || submitting}
            onClick={() => {
              if (timer <= 0) onResend();
            }}
            style={{
              background: "none",
              border: "none",
              color: timer > 0 ? "#9ca3af" : "#072818",
              fontWeight: "700",
              cursor: timer > 0 ? "not-allowed" : "pointer",
              textDecoration: timer > 0 ? "none" : "underline",
              padding: 0,
            }}
          >
            {resending ? "Sending New Code..." : timer > 0 ? `Resend OTP in ${timer}s` : "Resend New OTP"}
          </button>
        )}
      </div>

      {/* Optional Submit Button */}
      {onSubmit && (
        <button
          type="button"
          disabled={value.length !== length || submitting || disabled}
          onClick={onSubmit}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "14px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            marginTop: "6px",
          }}
        >
          {submitting ? "VERIFYING..." : submitLabel}
          <ArrowRightIcon size={15} />
        </button>
      )}
    </div>
  );
}
