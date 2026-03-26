import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.systemSetting.findMany();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

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
