import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const [tables, customers, categories, menusRaw, toppings, specialRequests, printSettings] =
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
        prisma.systemSetting.findMany({
          where: { key: { in: ["RECEIPT_WIDTH", "ORDER_PAPER_WIDTH"] } },
        }),
      ]);
    const receiptWidth = printSettings.find((s) => s.key === "RECEIPT_WIDTH")?.value ?? "80mm";
    const orderPaperWidth = printSettings.find((s) => s.key === "ORDER_PAPER_WIDTH")?.value ?? "80mm";

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
      receiptWidth: receiptWidth === "58mm" || receiptWidth === "80mm" ? receiptWidth : "80mm",
      orderPaperWidth: orderPaperWidth === "58mm" || orderPaperWidth === "80mm" ? orderPaperWidth : "80mm",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
