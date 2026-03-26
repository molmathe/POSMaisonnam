import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  const toppings = await prisma.topping.findMany({
    orderBy: { id: "asc" },
  });
  return NextResponse.json(toppings);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = Number(body.price);
    const group = typeof body.group === "string" ? body.group.trim() || null : null;

    if (!name || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อตัวเลือกและราคาให้ถูกต้อง" },
        { status: 400 }
      );
    }

    const topping = await prisma.topping.create({
      data: { name, price, group },
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
