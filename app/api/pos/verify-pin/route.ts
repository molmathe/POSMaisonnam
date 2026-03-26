import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin ?? "").trim();
  if (!pin) {
    return NextResponse.json({ message: "กรุณาใส่รหัส" }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { pinCode: pin },
    select: { id: true, name: true, role: true },
  });

  if (employee) {
    return NextResponse.json({
      name: employee.name,
      role: employee.role,
      isOwner: employee.role === "OWNER",
    });
  }

  // 2. Fallback: check POS_PINCODE setting (anonymous staff)
  const setting = await prisma.systemSetting.findFirst({
    where: { key: "POS_PINCODE" },
    select: { value: true },
  });
  const posPin = setting?.value || "1234";

  if (pin === posPin) {
    return NextResponse.json({ name: null, role: "STAFF", isOwner: false });
  }

  return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
}
