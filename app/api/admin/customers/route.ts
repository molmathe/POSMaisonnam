import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อลูกค้า" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: { name },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้างลูกค้าได้" },
      { status: 500 }
    );
  }
}

