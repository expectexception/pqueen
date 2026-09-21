const ADMIN_SESSION_COOKIE = "pqn-admin-session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing from .env"
    );
  }

  return secret;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );
  }

  return bytes.buffer as ArrayBuffer;
}

async function createSignature(
  value: string
): Promise<string> {
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

export async function createAdminSession(
  adminId: string
): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${adminId}.${timestamp}`;
  const signature = await createSignature(payload);

  return `${payload}.${signature}`;
}

export async function verifyAdminSession(
  token: string | undefined
): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const [adminId, timestampString, signature] = parts;

    if (!adminId || !timestampString || !signature) {
      return false;
    }

    const timestamp = Number(timestampString);

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    if (
      Date.now() - timestamp >
      SESSION_DURATION_MS
    ) {
      return false;
    }

    if (timestamp > Date.now() + 60_000) {
      return false;
    }

    const payload = `${adminId}.${timestampString}`;

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

    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signature),
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

export function getAdminSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE;
}