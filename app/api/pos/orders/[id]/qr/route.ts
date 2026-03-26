import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { table: true, customer: true, items: { include: { menu: true } } },
  });
  if (!order) {
    return NextResponse.json({ message: "ไม่พบออเดอร์" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { message: "ออเดอร์นี้ชำระแล้วหรือยกเลิกแล้ว" },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 ชม.

  let token = order.qrToken;
  let isNew = false;
  if (!token || (order.qrExpires && order.qrExpires < now)) {
    token = crypto.randomBytes(16).toString("hex");
    isNew = true;
    await prisma.order.update({
      where: { id },
      data: { qrToken: token, qrExpires: expiresAt },
    });
  } else {
    // ขยายอายุอีก 24 ชม. ทุกครั้งที่ขอ
    await prisma.order.update({
      where: { id },
      data: { qrExpires: expiresAt },
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const path = `/order/qr/${token}`;
  const url = baseUrl ? `${baseUrl}${path}` : path;

  return NextResponse.json({
    token,
    url: path,
    fullUrl: url,
    expiresAt: expiresAt.toISOString(),
    isNew,
  });
}
