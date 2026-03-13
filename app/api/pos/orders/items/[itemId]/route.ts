import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId: itemIdParam } = await params;
  const itemId = Number(itemIdParam);
  if (!itemId || Number.isNaN(itemId)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item || item.order.status !== "PENDING") {
      return NextResponse.json(
        { message: "ไม่พบรายการหรือออเดอร์ปิดแล้ว" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const quantity = body.quantity !== undefined ? Number(body.quantity) : item.quantity;
    const note = body.note !== undefined ? (body.note?.trim() || null) : item.note;
    const toppings = body.toppings !== undefined ? (Array.isArray(body.toppings) ? body.toppings : []) : (item.toppings as any[]);
    const requests = body.requests !== undefined ? (Array.isArray(body.requests) ? body.requests : []) : (item.requests as any[]);

    if (quantity < 1) {
      const orderId = item.orderId;
      await prisma.orderItem.delete({ where: { id: itemId } });
      await deleteOrderIfEmpty(orderId);
      return NextResponse.json({ deleted: true });
    }

    const toppingTotal = (toppings as { price?: number }[]).reduce((s, t) => s + (Number(t?.price) || 0), 0);
    const menu = await prisma.menu.findUnique({ where: { id: item.menuId } });
    const pricePerUnit = (menu?.price ?? 0) + toppingTotal;

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        quantity,
        price: pricePerUnit,
        note,
        toppings: toppings.length ? toppings : undefined,
        requests: requests.length ? requests : undefined,
      },
      include: { menu: true },
    });

    await updateOrderTotal(item.orderId);
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขรายการได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId: itemIdParam } = await params;
  const itemId = Number(itemIdParam);
  if (!itemId || Number.isNaN(itemId)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item) {
      return NextResponse.json({ message: "ไม่พบรายการ" }, { status: 404 });
    }
    if (item.order.status !== "PENDING") {
      return NextResponse.json(
        { message: "ออเดอร์ปิดแล้ว ไม่สามารถลบรายการได้" },
        { status: 400 }
      );
    }
    const orderId = item.orderId;
    await prisma.orderItem.delete({ where: { id: itemId } });
    await deleteOrderIfEmpty(orderId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถลบรายการได้" },
      { status: 500 }
    );
  }
}

async function updateOrderTotal(orderId: number) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  await prisma.order.update({
    where: { id: orderId },
    data: { totalPrice },
  });
}

async function deleteOrderIfEmpty(orderId: number) {
  const count = await prisma.orderItem.count({ where: { orderId } });
  if (count === 0) {
    await prisma.order.delete({ where: { id: orderId } });
  } else {
    await updateOrderTotal(orderId);
  }
}
