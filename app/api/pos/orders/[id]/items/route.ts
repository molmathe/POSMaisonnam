import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
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

    // FIX 3: Fetch topping prices from DB — never trust client-supplied prices
    const toppingIds = (toppings as { id?: number }[]).map((t) => t.id).filter((id): id is number => typeof id === "number");
    const dbToppings = await prisma.topping.findMany({ where: { id: { in: toppingIds } } });
    const dbToppingMap = new Map(dbToppings.map((t) => [t.id, t.price]));
    const toppingTotal = (toppings as { id?: number }[]).reduce(
      (s, t) => s + (Number(dbToppingMap.get(t.id as number)) || 0),
      0
    );

    const pricePerUnit = menu.price + toppingTotal;

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
