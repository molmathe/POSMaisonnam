import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");

  if (!tableId) {
    const orders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        tableId: { not: null },
        items: { some: {} },
      },
      include: { table: true, customer: true, items: true },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(orders);
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
      items: { include: { menu: true } },
    },
  });

  return NextResponse.json(order);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tableId = body.tableId ? Number(body.tableId) : null;
    const customerId = body.customerId ? Number(body.customerId) : null;
    const servedBy = typeof body.servedBy === "string" && body.servedBy ? body.servedBy : null;

    const order = await prisma.order.create({
      data: { tableId, customerId, status: "PENDING", servedBy },
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
