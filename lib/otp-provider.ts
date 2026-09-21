import { sendOtpEmail } from "@/lib/email";

export type OtpChannel = "EMAIL" | "SMS";

export interface SendOtpPayload {
  destination: string;
  otp: string;
  channel: OtpChannel;
  purpose: string;
  name?: string;
}

export interface ProviderResult {
  success: boolean;
  channel: OtpChannel;
  destination: string;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Mask destination identifier for secure client feedback
 * e.g. "radhika.sharma@gmail.com" -> "ra*****@gmail.com"
 * e.g. "9876543210" -> "+91 98****3210"
 */
export function maskDestination(destination: string): string {
  const trimmed = destination.trim();
  if (trimmed.includes("@")) {
    const [user, domain] = trimmed.split("@");
    if (!domain) return trimmed;
    const maskedUser = user.length <= 2 ? `${user}*` : `${user.slice(0, 2)}${"*".repeat(Math.max(3, user.length - 2))}`;
    return `${maskedUser}@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) {
    const phone = digits.slice(-10);
    return `+91 ${phone.slice(0, 2)}****${phone.slice(-4)}`;
  }
  return trimmed;
}

/**
 * Dispatch SMS OTP via configured SMS Gateway
 */
async function dispatchSmsOtp(payload: SendOtpPayload): Promise<ProviderResult> {
  const provider = (process.env.OTP_SMS_PROVIDER || "SIMULATED").toUpperCase();
  const apiKey = (process.env.OTP_SMS_API_KEY || process.env.FAST2SMS_API_KEY || "").trim();
  const senderId = (process.env.OTP_SMS_SENDER_ID || "PQNQUEEN").trim();
  const phone = payload.destination.replace(/\D/g, "").slice(-10);

  const messageText = `Your PQN Party Queen security code is ${payload.otp}. Valid for 5 minutes. Please do not share this OTP with anyone.`;

  // 1. Fast2SMS Gateway (India DLT & Quick SMS)
  if (provider === "FAST2SMS" && apiKey) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: payload.otp,
          numbers: phone,
        }),
      });

      const data = await response.json();
      if (data.return === true || data.status_code === 200) {
        return {
          success: true,
          channel: "SMS",
          destination: maskDestination(payload.destination),
          messageId: data.request_id || "fast2sms-ok",
        };
      }
      console.warn("[Fast2SMS Delivery Warning]:", data.message);
      return { success: false, channel: "SMS", destination: payload.destination, error: data.message || "SMS dispatch failed." };
    } catch (err: any) {
      console.error("[Fast2SMS Error]:", err.message);
      return { success: false, channel: "SMS", destination: payload.destination, error: err.message };
    }
  }

  // 2. MSG91 Gateway
  if (provider === "MSG91" && apiKey) {
    const authKey = apiKey;
    const templateId = process.env.MSG91_TEMPLATE_ID || "";
    try {
      const response = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${phone}&authkey=${authKey}&otp=${payload.otp}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.type === "success") {
        return {
          success: true,
          channel: "SMS",
          destination: maskDestination(payload.destination),
          messageId: data.message,
        };
      }
      return { success: false, channel: "SMS", destination: payload.destination, error: data.message || "MSG91 dispatch failed." };
    } catch (err: any) {
      return { success: false, channel: "SMS", destination: payload.destination, error: err.message };
    }
  }

  // 3. Twilio SMS Gateway
  if (provider === "TWILIO" && apiKey) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = apiKey;
    const fromNumber = process.env.TWILIO_FROM_NUMBER || "";
    if (accountSid && fromNumber) {
      try {
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
        const body = new URLSearchParams({
          To: `+91${phone}`,
          From: fromNumber,
          Body: messageText,
        });

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });
        const data = await response.json();
        if (response.ok) {
          return {
            success: true,
            channel: "SMS",
            destination: maskDestination(payload.destination),
            messageId: data.sid,
          };
        }
        return { success: false, channel: "SMS", destination: payload.destination, error: data.message || "Twilio dispatch failed." };
      } catch (err: any) {
        return { success: false, channel: "SMS", destination: payload.destination, error: err.message };
      }
    }
  }

  // 4. Simulated / Development fallback
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n======================================================`);
    console.log(`[SMS SIMULATION - OTP Provider: ${provider}]`);
    console.log(`To: +91 ${phone}`);
    console.log(`OTP Code: ${payload.otp}`);
    console.log(`Message: ${messageText}`);
    console.log(`======================================================\n`);
  }

  return {
    success: true,
    channel: "SMS",
    destination: maskDestination(payload.destination),
    simulated: true,
  };
}

/**
 * Dispatch Email OTP via Nodemailer & Gmail SMTP
 */
async function dispatchEmailOtp(payload: SendOtpPayload): Promise<ProviderResult> {
  const emailRes = await sendOtpEmail({
    email: payload.destination.trim().toLowerCase(),
    name: payload.name,
    otp: payload.otp,
    purpose: payload.purpose,
  });

  if (!emailRes.success) {
    return {
      success: false,
      channel: "EMAIL",
      destination: payload.destination,
      error: emailRes.error || "Failed to dispatch verification email.",
    };
  }

  return {
    success: true,
    channel: "EMAIL",
    destination: maskDestination(payload.destination),
    simulated: emailRes.simulated,
  };
}

/**
 * Unified Multi-Channel OTP Dispatcher
 */
export async function sendOtpToDestination(payload: SendOtpPayload): Promise<ProviderResult> {
  if (payload.channel === "SMS") {
    return dispatchSmsOtp(payload);
  }
  return dispatchEmailOtp(payload);
}
