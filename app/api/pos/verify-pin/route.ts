import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signToken } from "@/lib/auth";

// FIX 2: Simple in-memory rate limiter
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // FIX 2: Rate limiting
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { message: "ลองใหม่ได้ในอีก 1 นาที (เกินจำนวนครั้งที่อนุญาต)" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const pin = String(body.pin ?? "").trim();
  if (!pin) {
    return NextResponse.json({ message: "กรุณาใส่รหัส" }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { pinCode: pin },
    select: { id: true, name: true, role: true },
  });

  if (employee) {
    const role = employee.role === "OWNER" ? "OWNER" : "STAFF";
    const token = signToken({ role });
    const response = NextResponse.json({
      name: employee.name,
      role: employee.role,
      isOwner: employee.role === "OWNER",
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400,
    });
    return response;
  }

  // FIX 11: Fallback to POS_PINCODE setting — no hardcoded default
  const setting = await prisma.systemSetting.findFirst({
    where: { key: "POS_PINCODE" },
    select: { value: true },
  });

  // FIX 11: If POS_PINCODE is not configured, require it to be set first
  if (!setting?.value) {
    return NextResponse.json(
      { message: "ยังไม่ได้ตั้งค่า PIN สำหรับพนักงาน กรุณาติดต่อเจ้าของร้าน" },
      { status: 503 }
    );
  }

  if (pin === setting.value) {
    const token = signToken({ role: "STAFF" });
    const response = NextResponse.json({ name: null, role: "STAFF", isOwner: false });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400,
    });
    return response;
  }

  return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
}
