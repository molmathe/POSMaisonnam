import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.systemSetting.findMany();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = typeof body.key === "string" ? body.key.trim() : "";
    const value = typeof body.value === "string" ? body.value : "";
    const description = typeof body.description === "string" ? body.description : "";

    if (!key) {
      return NextResponse.json({ message: "กรุณาระบุ key" }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, description },
    });

    return NextResponse.json(setting);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถบันทึกการตั้งค่าได้" },
      { status: 500 }
    );
  }
}
