import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = Number(searchParams.get("employeeId"));
  const where = employeeId ? { employeeId } : {};
  const attendances = await prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(attendances);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const employeeId = Number(body.employeeId);
    const extraPay = Number(body.extraPay ?? 0);
    const isExtraOnly = Boolean(body.isExtraOnly);

    if (!employeeId || Number.isNaN(employeeId)) {
      return NextResponse.json(
        { message: "กรุณาระบุรหัสพนักงาน" },
        { status: 400 }
      );
    }

    // ป้องกันเช็คชื่อซ้ำในวันเดียวกัน (ยกเว้น isExtraOnly)
    if (!isExtraOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existing = await prisma.attendance.findFirst({
        where: {
          employeeId,
          date: { gte: today, lt: tomorrow },
          extraPay: 0,
        },
      });
      if (existing) {
        return NextResponse.json(
          { message: "พนักงานเช็คชื่อวันนี้แล้ว" },
          { status: 409 }
        );
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        extraPay: isExtraOnly ? extraPay : 0,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถบันทึกการเข้างานได้" },
      { status: 500 }
    );
  }
}
