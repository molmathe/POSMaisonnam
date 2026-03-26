import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pos_session";

function getSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export function signToken(payload: { role: "OWNER" | "STAFF" }): string {
  const base64payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(JSON.stringify(payload))
    .digest("hex");
  return `${base64payload}.${hmac}`;
}

export function verifyToken(token: string): { role: "OWNER" | "STAFF" } | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;
    const base64payload = token.slice(0, dotIndex);
    const providedHmac = token.slice(dotIndex + 1);
    const payloadStr = Buffer.from(base64payload, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as { role: "OWNER" | "STAFF" };
    const expectedHmac = crypto
      .createHmac("sha256", getSecret())
      .update(JSON.stringify(payload))
      .digest("hex");
    // Constant-time comparison to prevent timing attacks
    const expected = Buffer.from(expectedHmac, "hex");
    const provided = Buffer.from(providedHmac, "hex");
    if (expected.length !== provided.length) return null;
    if (!crypto.timingSafeEqual(expected, provided)) return null;
    if (payload.role !== "OWNER" && payload.role !== "STAFF") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(
  request: Request,
  requiredRole?: "OWNER"
): Promise<{ role: "OWNER" | "STAFF" } | NextResponse> {
  // Try cookie from the request headers first (works in Route Handlers)
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  let token = match ? decodeURIComponent(match[1]) : null;

  // Fallback to next/headers (works in Server Components / Middleware contexts)
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE)?.value ?? null;
    } catch {
      // cookies() may not be available in all contexts
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (requiredRole === "OWNER" && session.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return session;
}
