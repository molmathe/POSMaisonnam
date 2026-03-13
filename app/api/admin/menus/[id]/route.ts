import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

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
      : undefined;
    const requestIds = Array.isArray(body.requestIds)
      ? body.requestIds.filter((id: unknown) => typeof id === "number" && Number.isInteger(id))
      : undefined;

    if (!nameTh || !categoryId || Number.isNaN(price) || price <= 0) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลเมนูให้ครบถ้วน" },
        { status: 400 }
      );
    }

    await prisma.menu.update({
      where: { id },
      data: {
        nameTh,
        nameEn,
        price,
        categoryId,
        imageUrl,
      },
    });

    if (toppingIds !== undefined) {
      await prisma.menuTopping.deleteMany({ where: { menuId: id } });
      if (toppingIds.length > 0) {
        await prisma.menuTopping.createMany({
          data: toppingIds.map((toppingId: number) => ({ menuId: id, toppingId })),
        });
      }
    }
    if (requestIds !== undefined) {
      await prisma.menuSpecialRequest.deleteMany({ where: { menuId: id } });
      if (requestIds.length > 0) {
        await prisma.menuSpecialRequest.createMany({
          data: requestIds.map((specialRequestId: number) => ({ menuId: id, specialRequestId })),
        });
      }
    }

    const updated = await prisma.menu.findUnique({
      where: { id },
      include: {
        category: true,
        menuToppings: { select: { toppingId: true } },
        menuSpecialRequests: { select: { specialRequestId: true } },
      },
    });
    if (!updated) return NextResponse.json({ message: "ไม่พบเมนู" }, { status: 404 });
    const { menuToppings, menuSpecialRequests, ...rest } = updated as typeof updated & {
      menuToppings?: { toppingId: number }[];
      menuSpecialRequests?: { specialRequestId: number }[];
    };
    const out = {
      ...rest,
      allowedToppingIds: menuToppings?.map((mt) => mt.toppingId) ?? [],
      allowedRequestIds: menuSpecialRequests?.map((mr) => mr.specialRequestId) ?? [],
    };
    return NextResponse.json(out);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขเมนูได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ message: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    // Soft delete — ออเดอร์เก่ายังอ้างอิงเมนูได้ แค่ซ่อนจากรายการและ POS
    await prisma.menu.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถลบเมนูได้" },
      { status: 400 }
    );
  }
}

