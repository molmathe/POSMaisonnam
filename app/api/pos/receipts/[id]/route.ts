import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    return NextResponse.json({ message: "ไม่พบบิล" }, { status: 404 });
  }
  return NextResponse.json(order);
}

// ปรับส่วนลดภายหลัง (ถ้าจำเป็น)
export async function PATCH(
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
      return NextResponse.json({ message: "ไม่พบบิล" }, { status: 404 });
    }
    if (order.status !== "PAID") {
      return NextResponse.json(
        { message: "แก้ไขได้เฉพาะบิลที่ชำระแล้ว" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const rawDiscount = Number(body.discount ?? order.discount ?? 0);
    const discount =
      Number.isFinite(rawDiscount) && rawDiscount >= 0 ? rawDiscount : order.discount ?? 0;

    const subtotal = order.items.reduce(
      (s, i) => s + i.price * i.quantity,
      0
    );
    const totalPrice = Math.max(0, subtotal - discount);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        discount,
        totalPrice,
      },
      include: { table: true, customer: true, items: { include: { menu: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขบิลได้" },
      { status: 500 }
    );
  }
}

// ยกเลิกบิล แทนการลบจริง
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { table: true, customer: true, items: true },
    });
    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถยกเลิกบิลได้" },
      { status: 500 }
    );
  }
}

