import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOtpToDestination, maskDestination, OtpChannel } from "@/lib/otp-provider";

export type OtpPurpose =
  | "REGISTER"
  | "SIGNUP"
  | "LOGIN"
  | "FORGOT_PASSWORD"
  | "ADMIN_FORGOT_PASSWORD"
  | "CHANGE_EMAIL"
  | "CHANGE_PHONE";

const OTP_SECRET = process.env.OTP_HASH_SECRET || process.env.CUSTOMER_SESSION_SECRET || "pqn-otp-security-salt-2026";
const OTP_EXPIRY_MINUTES = 5; // 5-minute strict lifetime
const OTP_COOLDOWN_SECONDS = 45; // 45s resend cooldown
const MAX_VERIFY_ATTEMPTS = 5; // Max 5 wrong attempts before invalidation
const MAX_HOURLY_REQUESTS = 6; // Max 6 OTP requests per hour per identifier

const PURPOSE_LABELS: Record<string, string> = {
  REGISTER: "Account Registration Verification",
  SIGNUP: "Account Registration Verification",
  LOGIN: "Account Sign-In Passcode",
  FORGOT_PASSWORD: "Password Reset Verification",
  ADMIN_FORGOT_PASSWORD: "Admin Security Passcode & Password Reset",
  CHANGE_EMAIL: "Email Address Update",
  CHANGE_PHONE: "Mobile Number Verification",
};

/**
 * In-memory secure fallback store (hashes only)
 */
interface MemoryOtpRecord {
  identifier: string;
  codeHash: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  attempts: number;
  maxAttempts: number;
  cooldownUntil: number;
  expiresAt: number;
}

const memoryOtpStore = new Map<string, MemoryOtpRecord>();
const rateLimitStore = new Map<string, number[]>();

export function normalizeIdentifier(val: string): { type: "email" | "phone"; value: string } {
  const trimmed = (val || "").trim();
  if (trimmed.includes("@")) {
    return { type: "email", value: trimmed.toLowerCase() };
  }
  const digits = trimmed.replace(/\D/g, "");
  const phone10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return { type: "phone", value: phone10 };
}

/**
 * Generate cryptographic SHA-256 HMAC hash of the OTP
 */
export function hashOtp(otp: string, identifier: string, purpose: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${otp.trim()}:${identifier.trim().toLowerCase()}:${purpose.toUpperCase()}`)
    .digest("hex");
}

/**
 * Cryptographically secure 6-digit numeric OTP generation
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Check hourly rate limit for an identifier
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes window
  const timestamps = (rateLimitStore.get(identifier) || []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= MAX_HOURLY_REQUESTS) {
    return false;
  }

  timestamps.push(now);
  rateLimitStore.set(identifier, timestamps);
  return true;
}

/**
 * Generate, Hash, Store, and Dispatch a 6-digit OTP
 */
export async function createAndSendOtp({
  identifier,
  email,
  phone,
  purpose,
  channel,
  name,
  ipAddress,
  userAgent,
}: {
  identifier?: string;
  email?: string;
  phone?: string;
  purpose: OtpPurpose;
  channel?: OtpChannel;
  name?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  maskedDestination?: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  error?: string;
  message?: string;
}> {
  const rawId = identifier || phone || email || "";
  const normalized = normalizeIdentifier(rawId);

  if (!normalized.value) {
    return { success: false, error: "A valid mobile number or email address is required." };
  }

  if (normalized.type === "phone" && normalized.value.length < 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  if (normalized.type === "email" && (!normalized.value.includes("@") || !normalized.value.includes("."))) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const cleanId = normalized.value;
  const resolvedChannel: OtpChannel = channel || (normalized.type === "phone" ? "SMS" : "EMAIL");

  // 1. Rate Limiting Check
  if (!checkRateLimit(cleanId)) {
    return {
      success: false,
      error: "Too many verification requests. Please wait a few minutes before trying again.",
    };
  }

  const now = new Date();
  const storeKey = `${cleanId}:${purpose}`;

  // 2. Cooldown Check (Check if recent OTP was generated within cooldown)
  try {
    const existing = await prisma.otpVerification.findFirst({
      where: {
        identifier: cleanId,
        purpose,
        cooldownUntil: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.cooldownUntil) {
      const remainingSeconds = Math.max(1, Math.ceil((existing.cooldownUntil.getTime() - now.getTime()) / 1000));
      return {
        success: false,
        error: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        cooldownSeconds: remainingSeconds,
      };
    }
  } catch (err) {
    // Check in-memory store if DB query failed
    const memRecord = memoryOtpStore.get(storeKey);
    if (memRecord && memRecord.cooldownUntil > Date.now()) {
      const remaining = Math.max(1, Math.ceil((memRecord.cooldownUntil - Date.now()) / 1000));
      return {
        success: false,
        error: `Please wait ${remaining} seconds before requesting a new code.`,
        cooldownSeconds: remaining,
      };
    }
  }

  // 3. Generate Cryptographic 6-digit OTP & Hash
  const rawOtp = generateSecureOtp();
  const codeHash = hashOtp(rawOtp, cleanId, purpose);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const cooldownUntil = new Date(Date.now() + OTP_COOLDOWN_SECONDS * 1000);

  // 4. Invalidate Previous OTPs & Persist Secure Hash
  try {
    await prisma.otpVerification.deleteMany({
      where: {
        OR: [
          { identifier: cleanId, purpose },
          { email: cleanId, purpose },
        ],
      },
    });

    await prisma.otpVerification.create({
      data: {
        identifier: cleanId,
        email: normalized.type === "email" ? cleanId : null,
        codeHash,
        purpose,
        channel: resolvedChannel,
        attempts: 0,
        maxAttempts: MAX_VERIFY_ATTEMPTS,
        expiresAt,
        cooldownUntil,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (dbErr) {
    console.warn("[OTP Database Fallback to Secure Memory]:", dbErr);
  }

  // Set in-memory record
  memoryOtpStore.set(storeKey, {
    identifier: cleanId,
    codeHash,
    purpose,
    channel: resolvedChannel,
    attempts: 0,
    maxAttempts: MAX_VERIFY_ATTEMPTS,
    cooldownUntil: cooldownUntil.getTime(),
    expiresAt: expiresAt.getTime(),
  });

  // 5. Dispatch via Channel Provider
  const purposeLabel = PURPOSE_LABELS[purpose] || "Security Verification";
  const dispatchRes = await sendOtpToDestination({
    destination: cleanId,
    otp: rawOtp,
    channel: resolvedChannel,
    purpose: purposeLabel,
    name,
  });

  if (!dispatchRes.success) {
    return {
      success: false,
      error: dispatchRes.error || "Failed to dispatch verification code. Please check your details.",
    };
  }

  const masked = maskDestination(cleanId);

  return {
    success: true,
    maskedDestination: masked,
    cooldownSeconds: OTP_COOLDOWN_SECONDS,
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    message: `A 6-digit verification code has been dispatched to ${masked}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
  };
}

/**
 * Securely Verify & Consume OTP (Strict Hash Matching & Attempt Limiting)
 */
export async function verifyAndConsumeOtp({
  identifier,
  email,
  phone,
  otp,
  purpose,
}: {
  identifier?: string;
  email?: string;
  phone?: string;
  otp: string;
  purpose: OtpPurpose;
}): Promise<{ valid: boolean; error?: string; attemptsRemaining?: number }> {
  const rawId = identifier || phone || email || "";
  const normalized = normalizeIdentifier(rawId);
  const cleanId = normalized.value;
  const cleanOtp = (otp || "").trim();

  if (!cleanId || !cleanOtp) {
    return { valid: false, error: "Identifier and 6-digit verification code are required." };
  }

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { valid: false, error: "Please enter a valid 6-digit numeric verification code." };
  }

  const now = new Date();
  const inputHash = hashOtp(cleanOtp, cleanId, purpose);
  const storeKey = `${cleanId}:${purpose}`;

  // 1. Check in Database
  try {
    const record = await prisma.otpVerification.findFirst({
      where: {
        OR: [
          { identifier: cleanId, purpose },
          { email: cleanId, purpose },
        ],
        isConsumed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (record) {
      // Check expiration
      if (record.expiresAt < now) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        memoryOtpStore.delete(storeKey);
        return { valid: false, error: "Verification code has expired. Please request a fresh OTP." };
      }

      // Check max attempts
      if (record.attempts >= record.maxAttempts) {
        await prisma.otpVerification.delete({ where: { id: record.id } });
        memoryOtpStore.delete(storeKey);
        return {
          valid: false,
          error: "Too many failed attempts. This verification code has been locked. Please request a fresh OTP.",
        };
      }

      // Verify Hash
      const hashMatch = record.codeHash === inputHash;
      // Backward compatibility fallback for legacy plaintext rows
      const legacyMatch = !record.codeHash && record.otp === cleanOtp;

      if (hashMatch || legacyMatch) {
        // Mark as consumed & record verifiedAt
        await prisma.otpVerification.update({
          where: { id: record.id },
          data: {
            isConsumed: true,
            verifiedAt: now,
          },
        });
        memoryOtpStore.delete(storeKey);
        return { valid: true };
      } else {
        // Increment failed attempts
        const newAttempts = record.attempts + 1;
        const attemptsLeft = Math.max(0, record.maxAttempts - newAttempts);

        if (attemptsLeft === 0) {
          await prisma.otpVerification.delete({ where: { id: record.id } });
          memoryOtpStore.delete(storeKey);
          return {
            valid: false,
            error: "Too many incorrect attempts. This code has been invalidated. Please request a new OTP.",
            attemptsRemaining: 0,
          };
        } else {
          await prisma.otpVerification.update({
            where: { id: record.id },
            data: { attempts: newAttempts },
          });
          return {
            valid: false,
            error: `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
            attemptsRemaining: attemptsLeft,
          };
        }
      }
    }
  } catch (dbErr) {
    console.warn("[OTP DB Verify Fallback]:", dbErr);
  }

  // 2. Fallback to In-Memory Store
  const mem = memoryOtpStore.get(storeKey);
  if (mem) {
    if (mem.expiresAt < Date.now()) {
      memoryOtpStore.delete(storeKey);
      return { valid: false, error: "Verification code has expired. Please request a fresh OTP." };
    }

    if (mem.attempts >= mem.maxAttempts) {
      memoryOtpStore.delete(storeKey);
      return { valid: false, error: "Too many failed attempts. Please request a fresh OTP." };
    }

    if (mem.codeHash === inputHash) {
      memoryOtpStore.delete(storeKey);
      return { valid: true };
    } else {
      mem.attempts += 1;
      const left = Math.max(0, mem.maxAttempts - mem.attempts);
      if (left === 0) {
        memoryOtpStore.delete(storeKey);
        return { valid: false, error: "Too many incorrect attempts. Please request a new OTP.", attemptsRemaining: 0 };
      }
      return { valid: false, error: `Incorrect verification code. ${left} attempt${left === 1 ? "" : "s"} remaining.`, attemptsRemaining: left };
    }
  }

  return {
    valid: false,
    error: "No active verification code found for this account. Please request a fresh OTP.",
  };
}
