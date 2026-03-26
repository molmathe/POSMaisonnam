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
    const dailyWage = Number(body.dailyWage);
    const role = body.role === "OWNER" ? "OWNER" : "STAFF";
    const pinCode =
      role === "OWNER" && typeof body.pinCode === "string" && body.pinCode.trim()
        ? body.pinCode.trim()
        : null;

    if (!name || Number.isNaN(dailyWage) || dailyWage < 0) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลพนักงานให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: { name, dailyWage, role, pinCode },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขพนักงานได้" },
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
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถลบพนักงานได้" },
      { status: 400 }
    );
  }
}
