import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** PENDING orders with no table (for admin cleanup). */
export async function GET() {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING", tableId: null, items: { some: {} } },
    include: {
      customer: true,
      items: { include: { menu: true } },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(orders);
}
