import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ message: "ไม่พบออเดอร์" }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { message: "ออเดอร์นี้ชำระเงินแล้วหรือยกเลิกแล้ว" },
        { status: 400 }
      );
    }

    const totalPrice = order.items.reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );

    await prisma.order.update({
      where: { id },
      data: { status: "PAID", totalPrice },
    });

    const updated = await prisma.order.findUnique({
      where: { id },
      include: { table: true, customer: true, items: { include: { menu: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถบันทึกการชำระเงินได้" },
      { status: 500 }
    );
  }
}
