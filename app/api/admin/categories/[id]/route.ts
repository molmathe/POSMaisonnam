import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

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

    // Soft-deleted menus still hold the categoryId FK and may have OrderItems (no cascade).
    // Reassign them to another category so the FK is released before deleting.
    const hasSoftDeleted = await prisma.menu.count({
      where: { categoryId: id, deletedAt: { not: null } },
    });
    if (hasSoftDeleted > 0) {
      const otherCat = await prisma.category.findFirst({ where: { id: { not: id } } });
      if (!otherCat) {
        return NextResponse.json(
          { message: "ไม่สามารถลบหมวดหมู่เดียวที่มีอยู่ในระบบได้" },
          { status: 400 }
        );
      }
      await prisma.menu.updateMany({
        where: { categoryId: id, deletedAt: { not: null } },
        data: { categoryId: otherCat.id },
      });
    }

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
