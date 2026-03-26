import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

interface MenuRow {
  nameTh: string;
  nameEn?: string;
  price: number;
  cost?: number;
  category: string;
  imageUrl?: string;
  toppings?: string;
  specialRequests?: string;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "OWNER");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const rows: MenuRow[] = body;

    // Validate all rows first
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.nameTh || typeof r.nameTh !== "string") {
        return NextResponse.json({ error: `แถวที่ ${i + 1}: ต้องมีชื่อเมนู (nameTh)` }, { status: 400 });
      }
      if (!r.price || isNaN(Number(r.price)) || Number(r.price) <= 0) {
        return NextResponse.json({ error: `แถวที่ ${i + 1}: ราคาไม่ถูกต้อง` }, { status: 400 });
      }
      if (!r.category || typeof r.category !== "string") {
        return NextResponse.json({ error: `แถวที่ ${i + 1}: ต้องมีหมวดหมู่ (category)` }, { status: 400 });
      }
    }

    // Load all categories, toppings, special requests for lookup
    const [categories, toppings, specialRequests] = await Promise.all([
      prisma.category.findMany(),
      prisma.topping.findMany(),
      prisma.specialRequest.findMany(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const toppingMap = new Map(toppings.map((t) => [t.name.toLowerCase(), t.id]));
    const requestMap = new Map(specialRequests.map((r) => [r.name.toLowerCase(), r.id]));

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;

      const categoryId = categoryMap.get(r.category.trim().toLowerCase());
      if (!categoryId) {
        results.errors.push(`แถวที่ ${rowNum} (${r.nameTh}): ไม่พบหมวดหมู่ "${r.category}"`);
        results.skipped++;
        continue;
      }

      // Parse toppings and requests by name
      const toppingNames = r.toppings ? r.toppings.split("|").map((s) => s.trim()).filter(Boolean) : [];
      const requestNames = r.specialRequests ? r.specialRequests.split("|").map((s) => s.trim()).filter(Boolean) : [];

      const toppingIds: number[] = [];
      for (const name of toppingNames) {
        const id = toppingMap.get(name.toLowerCase());
        if (id) toppingIds.push(id);
        else results.errors.push(`แถวที่ ${rowNum}: ไม่พบ topping "${name}" (ข้ามและดำเนินการต่อ)`);
      }

      const requestIds: number[] = [];
      for (const name of requestNames) {
        const id = requestMap.get(name.toLowerCase());
        if (id) requestIds.push(id);
        else results.errors.push(`แถวที่ ${rowNum}: ไม่พบคำขอพิเศษ "${name}" (ข้ามและดำเนินการต่อ)`);
      }

      try {
        const menu = await prisma.menu.create({
          data: {
            nameTh: r.nameTh.trim(),
            nameEn: r.nameEn?.trim() || null,
            price: Number(r.price),
            cost: r.cost != null && !isNaN(Number(r.cost)) ? Number(r.cost) : null,
            categoryId,
            imageUrl: r.imageUrl?.trim() || null,
          },
        });

        if (toppingIds.length > 0) {
          await prisma.menuTopping.createMany({
            data: toppingIds.map((toppingId) => ({ menuId: menu.id, toppingId })),
          });
        }
        if (requestIds.length > 0) {
          await prisma.menuSpecialRequest.createMany({
            data: requestIds.map((specialRequestId) => ({ menuId: menu.id, specialRequestId })),
          });
        }

        results.created++;
      } catch (err) {
        console.error(err);
        results.errors.push(`แถวที่ ${rowNum} (${r.nameTh}): บันทึกไม่สำเร็จ`);
        results.skipped++;
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "ไม่สามารถนำเข้าข้อมูลได้" }, { status: 500 });
  }
}
