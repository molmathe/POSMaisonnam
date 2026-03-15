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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อหมวดหมู่" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขหมวดหมู่ได้" },
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
    // Block if active (non-deleted) menus exist in this category
    const activeMenus = await prisma.menu.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (activeMenus > 0) {
      return NextResponse.json(
        { message: `ไม่สามารถลบได้ ยังมีเมนูอยู่ ${activeMenus} รายการ กรุณาลบเมนูก่อน` },
        { status: 400 }
      );
    }

    // Permanently delete soft-deleted menus in this category (they still hold the FK)
    await prisma.menu.deleteMany({
      where: { categoryId: id, deletedAt: { not: null } },
    });

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถลบหมวดหมู่ได้" },
      { status: 400 }
    );
  }
}

