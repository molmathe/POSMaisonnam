import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Pending orders with items + menu for order queue monitor (TV/iPad). */
export async function GET() {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING", items: { some: {} } },
    include: {
      table: true,
      customer: true,
      items: { include: { menu: true } },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(orders);
}
