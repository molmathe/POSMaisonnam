import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const toppings = await prisma.topping.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(toppings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = Number(body.price);

    if (!name || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อตัวเลือกและราคาให้ถูกต้อง" },
        { status: 400 }
      );
    }

    const topping = await prisma.topping.create({
      data: { name, price },
    });

    return NextResponse.json(topping, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "ไม่สามารถสร้าง Topping ได้" },
      { status: 500 }
    );
  }
}

