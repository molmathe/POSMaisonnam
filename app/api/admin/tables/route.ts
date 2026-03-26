import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tables = await prisma.table.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อโต๊ะ" },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: { name },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้างโต๊ะได้" },
      { status: 500 }
    );
  }
}

