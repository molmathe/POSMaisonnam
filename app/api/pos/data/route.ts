import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [tables, customers, categories, menusRaw, toppings, specialRequests] =
    await Promise.all([
      prisma.table.findMany({ orderBy: { name: "asc" } }),
      prisma.customer.findMany({ orderBy: { name: "asc" } }),
      prisma.category.findMany({ orderBy: { id: "asc" } }),
      prisma.menu.findMany({
        where: { deletedAt: null },
        include: {
          category: true,
          menuToppings: { select: { toppingId: true } },
          menuSpecialRequests: { select: { specialRequestId: true } },
        },
        orderBy: { categoryId: "asc" },
      }),
      prisma.topping.findMany({ orderBy: { id: "asc" } }),
      prisma.specialRequest.findMany({ orderBy: { id: "asc" } }),
    ]);

  const menus = menusRaw.map((m) => {
    const { menuToppings, menuSpecialRequests, ...rest } = m as typeof m & {
      menuToppings?: { toppingId: number }[];
      menuSpecialRequests?: { specialRequestId: number }[];
    };
    return {
      ...rest,
      allowedToppingIds: menuToppings?.map((mt) => mt.toppingId) ?? [],
      allowedRequestIds: menuSpecialRequests?.map((mr) => mr.specialRequestId) ?? [],
    };
  });

  return NextResponse.json({
    tables,
    customers,
    categories,
    menus,
    toppings,
    specialRequests,
  });
}
