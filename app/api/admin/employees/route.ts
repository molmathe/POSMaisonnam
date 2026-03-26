import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
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
    if (role === "OWNER" && !pinCode) {
      return NextResponse.json(
        { message: "เจ้าของร้านต้องกำหนด PIN Code" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: { name, dailyWage, role, pinCode },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้างพนักงานได้" },
      { status: 500 }
    );
  }
}
