import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const menusRaw = await prisma.menu.findMany({
    include: {
      category: true,
      menuToppings: { select: { toppingId: true } },
    },
    orderBy: { id: "asc" },
  });
  const menus = menusRaw.map((m) => {
    const { menuToppings, ...rest } = m as typeof m & { menuToppings?: { toppingId: number }[] };
    return { ...rest, allowedToppingIds: menuToppings?.map((mt) => mt.toppingId) ?? [] };
  });
  return NextResponse.json(menus);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nameTh = typeof body.nameTh === "string" ? body.nameTh.trim() : "";
    const nameEn =
      typeof body.nameEn === "string" && body.nameEn.trim()
        ? body.nameEn.trim()
        : null;
    const price = Number(body.price);
    const categoryId = Number(body.categoryId);
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;
    const toppingIds = Array.isArray(body.toppingIds)
      ? body.toppingIds.filter((id: unknown) => typeof id === "number" && Number.isInteger(id))
      : [];

    if (!nameTh || !categoryId || Number.isNaN(price) || price <= 0) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลเมนูให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const menu = await prisma.menu.create({
      data: {
        nameTh,
        nameEn,
        price,
        categoryId,
        imageUrl,
      },
    });

    if (toppingIds.length > 0) {
      await prisma.menuTopping.createMany({
        data: toppingIds.map((toppingId: number) => ({ menuId: menu.id, toppingId })),
      });
    }

    return NextResponse.json(menu, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้างเมนูได้" },
      { status: 500 }
    );
  }
}

