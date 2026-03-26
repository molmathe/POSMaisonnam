import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  try {
    const menus = await prisma.menu.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        menuToppings: { include: { topping: true } },
        menuSpecialRequests: { include: { specialRequest: true } },
      },
      orderBy: { id: "asc" },
    });

    const header = ["nameTh", "nameEn", "price", "cost", "category", "imageUrl", "toppings", "specialRequests"];

    const rows = menus.map((m) => {
      const toppings = m.menuToppings.map((mt) => mt.topping.name).join("|");
      const specialRequests = m.menuSpecialRequests.map((mr) => mr.specialRequest.name).join("|");
      return [
        csvCell(m.nameTh),
        csvCell(m.nameEn ?? ""),
        csvCell(String(m.price)),
        csvCell(m.cost != null ? String(m.cost) : ""),
        csvCell(m.category.name),
        csvCell(m.imageUrl ?? ""),
        csvCell(toppings),
        csvCell(specialRequests),
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="menus-export-${formatDate()}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "ไม่สามารถส่งออกข้อมูลได้" }, { status: 500 });
  }
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
