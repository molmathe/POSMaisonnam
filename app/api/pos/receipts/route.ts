import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateParam(value: string | null): { start: Date; end: Date } {
  const base = value ? new Date(value) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const { start, end } = parseDateParam(dateParam);

  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      paidAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: { paidAt: "asc" },
    include: {
      table: true,
      customer: true,
      items: { include: { menu: true } },
    },
  });

  const sumTotal = orders.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const sumDiscount = orders.reduce((s, o) => s + (o.discount ?? 0), 0);
  const sumCash = orders
    .filter((o) => o.payMethod === "CASH")
    .reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const sumQr = orders
    .filter((o) => o.payMethod === "QR")
    .reduce((s, o) => s + (o.totalPrice ?? 0), 0);

  return NextResponse.json({
    orders,
    summary: {
      sumTotal,
      sumDiscount,
      sumCash,
      sumQr,
    },
  });
}

