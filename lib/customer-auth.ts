const CUSTOMER_SESSION_COOKIE = "pqn-customer-session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "pqn-customer-super-secret-key-2026-couture";
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

async function createSignature(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return bytesToHex(signature);
}

export async function createCustomerSession(customerId: string): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${customerId}.${timestamp}`;
  const signature = await createSignature(payload);
  return `${payload}.${signature}`;
}

export async function verifyCustomerSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [customerId, timestampString, signature] = parts;
    if (!customerId || !timestampString || !signature) return null;

    const timestamp = Number(timestampString);
    if (!Number.isFinite(timestamp)) return null;

    // Check expiry
    if (Date.now() - timestamp > SESSION_DURATION_MS) return null;
    if (timestamp > Date.now() + 60_000) return null;

    const payload = `${customerId}.${timestampString}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signature),
      new TextEncoder().encode(payload)
    );

    return valid ? customerId : null;
  } catch {
    return null;
  }
}

export function getCustomerSessionCookieName(): string {
  return CUSTOMER_SESSION_COOKIE;
}
