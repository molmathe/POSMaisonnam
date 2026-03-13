import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token: tokenParam } = await params;
  const token = tokenParam?.trim();
  if (!token) {
    return NextResponse.json({ message: "ไม่พบรหัส" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { qrToken: token },
    include: {
      table: true,
      customer: true,
      items: { include: { menu: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ message: "ไม่พบรายการหรือรหัสหมดอายุ" }, { status: 404 });
  }
  if (order.qrExpires && new Date() > order.qrExpires) {
    return NextResponse.json({ message: "รหัสหมดอายุแล้ว" }, { status: 410 });
  }

  const items = order.items.map((i) => ({
    name: i.menu.nameTh,
    quantity: i.quantity,
    price: i.price,
    total: i.price * i.quantity,
    note: i.note,
    toppings: i.toppings,
    requests: i.requests,
  }));
  const totalPrice = items.reduce((s, i) => s + i.total, 0);

  return NextResponse.json({
    tableName: order.table?.name ?? "-",
    customerName: order.customer?.name ?? null,
    items,
    totalPrice,
    expiresAt: order.qrExpires?.toISOString() ?? null,
  });
}
