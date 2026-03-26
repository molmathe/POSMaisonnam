import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** PENDING orders with no table (for admin cleanup). */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

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
