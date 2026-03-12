import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");
  if (!tableId) {
    return NextResponse.json(
      { message: "กรุณาระบุ tableId" },
      { status: 400 }
    );
  }
  const tid = Number(tableId);
  if (Number.isNaN(tid)) {
    return NextResponse.json({ message: "tableId ไม่ถูกต้อง" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { tableId: tid, status: "PENDING" },
    include: {
      table: true,
      customer: true,
      items: {
        include: { menu: true },
      },
    },
  });

  return NextResponse.json(order);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tableId = body.tableId ? Number(body.tableId) : null;
    const customerId = body.customerId ? Number(body.customerId) : null;

    const order = await prisma.order.create({
      data: { tableId, customerId, status: "PENDING" },
      include: { table: true, customer: true, items: true },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้างออเดอร์ได้" },
      { status: 500 }
    );
  }
}
