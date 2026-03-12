import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const orderId = Number(idParam);
  if (!orderId || Number.isNaN(orderId)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const menuId = Number(body.menuId);
    const quantity = Number(body.quantity) || 1;
    const note = typeof body.note === "string" ? body.note.trim() || null : null;
    const toppings = Array.isArray(body.toppings) ? body.toppings : [];
    const requests = Array.isArray(body.requests) ? body.requests : [];

    if (!menuId || Number.isNaN(menuId) || quantity < 1) {
      return NextResponse.json(
        { message: "กรุณาระบุเมนูและจำนวน" },
        { status: 400 }
      );
    }

    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu) {
      return NextResponse.json({ message: "ไม่พบเมนู" }, { status: 404 });
    }

    const toppingTotal = toppings.reduce((s: number, t: { price?: number }) => s + (Number(t?.price) || 0), 0);
    const pricePerUnit = menu.price + toppingTotal;
    const price = pricePerUnit * quantity;

    const item = await prisma.orderItem.create({
      data: {
        orderId,
        menuId,
        quantity,
        price: pricePerUnit,
        note,
        toppings: toppings.length ? toppings : undefined,
        requests: requests.length ? requests : undefined,
      },
      include: { menu: true },
    });

    const items = await prisma.orderItem.findMany({
      where: { orderId },
    });
    const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
    await prisma.order.update({
      where: { id: orderId },
      data: { totalPrice },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มรายการได้" },
      { status: 500 }
    );
  }
}
