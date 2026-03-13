import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Mark order item as prepared by kitchen (จากจอคิว). ได้เฉพาะรายการที่ส่งครัวแล้ว */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId: itemIdParam } = await params;
  const itemId = Number(itemIdParam);
  if (!itemId || Number.isNaN(itemId)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true },
  });
  if (!item) {
    return NextResponse.json({ message: "ไม่พบรายการ" }, { status: 404 });
  }
  if (item.order.status !== "PENDING") {
    return NextResponse.json({ message: "ออเดอร์ปิดแล้ว" }, { status: 400 });
  }
  if (!item.sentToKitchen) {
    return NextResponse.json(
      { message: "รายการนี้ยังไม่ได้ส่งครัว ไม่สามารถกดทำแล้วได้" },
      { status: 400 }
    );
  }

  const currentCount = item.kitchenPreparedCount ?? 0;
  if (item.kitchenPreparedAt != null || currentCount >= item.quantity) {
    return NextResponse.json({ ok: true, count: item.quantity, quantity: item.quantity });
  }

  const nextCount = Math.min(currentCount + 1, item.quantity);
  const fullyDone = nextCount >= item.quantity;

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      kitchenPreparedCount: nextCount,
      ...(fullyDone ? { kitchenPreparedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ok: true, count: nextCount, quantity: item.quantity });
}
