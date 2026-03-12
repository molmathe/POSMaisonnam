import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const requests = await prisma.specialRequest.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกคำขอพิเศษ" },
        { status: 400 }
      );
    }

    const request = await prisma.specialRequest.create({
      data: { name },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้างคำขอพิเศษได้" },
      { status: 500 }
    );
  }
}

