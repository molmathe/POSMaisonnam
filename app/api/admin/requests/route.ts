import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  const requests = await prisma.specialRequest.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

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
