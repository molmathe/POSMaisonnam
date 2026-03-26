import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateParam } from "@/lib/date-utils";
import { requireAuth } from "@/lib/auth";

// FIX 8: Use shared parseDateParam utility
function getDateRange(value: string | null): { start: Date; end: Date } {
  const parsed = parseDateParam(value);
  if (parsed) return parsed;
  // Default to today
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const { start, end } = getDateRange(dateParam);

    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        paidAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { paidAt: "asc" },
      select: {
        id: true,
        totalPrice: true,
        discount: true,
        payMethod: true,
        paidAt: true,
        table: { select: { name: true } },
        customer: { select: { name: true } },
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
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
