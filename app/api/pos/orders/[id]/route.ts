import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      customer: true,
      items: { include: { menu: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ message: "ไม่พบออเดอร์" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const data: { tableId?: number | null; customerId?: number | null } = {};
    if (body.tableId !== undefined) data.tableId = body.tableId ? Number(body.tableId) : null;
    if (body.customerId !== undefined) data.customerId = body.customerId ? Number(body.customerId) : null;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { table: true, customer: true, items: { include: { menu: true } } },
    });
    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขออเดอร์ได้" },
      { status: 500 }
    );
  }
}
