import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawDiscount = Number(body.discount ?? 0);
    const discount = Number.isFinite(rawDiscount) && rawDiscount > 0 ? rawDiscount : 0;
    const methodRaw = typeof body.payMethod === "string" ? body.payMethod.toUpperCase() : null;
    const payMethod =
      methodRaw === "CASH" || methodRaw === "QR" ? (methodRaw as "CASH" | "QR") : null;

    const subtotal = order.items.reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );

    const totalPrice = Math.max(0, subtotal - discount);
    const cashReceived =
      payMethod === "CASH" && Number.isFinite(Number(body.cashReceived))
        ? Number(body.cashReceived)
        : null;
    const changeAmount =
      payMethod === "CASH" && cashReceived != null
        ? Math.max(0, cashReceived - totalPrice)
        : null;

    await prisma.order.update({
      where: { id },
      data: {
        status: "PAID",
        totalPrice,
        discount,
        payMethod,
        paidAt: new Date(),
        cashReceived: cashReceived ?? undefined,
        changeAmount: changeAmount ?? undefined,
      },
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
