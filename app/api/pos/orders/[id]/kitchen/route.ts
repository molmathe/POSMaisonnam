import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const orderId = Number(idParam);
  if (!orderId || Number.isNaN(orderId)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { menu: true } }, table: true, customer: true },
  });
  if (!order) {
    return NextResponse.json({ message: "ไม่พบออเดอร์" }, { status: 404 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { message: "ออเดอร์นี้ปิดบิลแล้ว" },
      { status: 400 }
    );
  }

  const newItems = order.items.filter((i) => !i.sentToKitchen);
  if (!newItems.length) {
    return NextResponse.json({ items: [], order }, { status: 200 });
  }

  await prisma.orderItem.updateMany({
    where: { id: { in: newItems.map((i) => i.id) } },
    data: { sentToKitchen: true },
  });

  return NextResponse.json({
    order: {
      id: order.id,
      table: order.table,
      customer: order.customer,
    },
    items: newItems,
  });
}

