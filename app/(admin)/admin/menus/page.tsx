import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MenuForm from "./_MenuForm";
import MenuList from "./_MenuList";

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const [menusRaw, categories, toppings] = await Promise.all([
    prisma.menu.findMany({
      include: {
        category: true,
        menuToppings: { select: { toppingId: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.topping.findMany({ orderBy: { id: "asc" } }),
  ]);
  const menus = menusRaw.map((m) => {
    const { menuToppings, ...rest } = m as typeof m & { menuToppings?: { toppingId: number }[] };
    return { ...rest, allowedToppingIds: menuToppings?.map((mt) => mt.toppingId) ?? [] };
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการเมนูอาหารและเครื่องดื่ม
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            เพิ่ม ลบ แก้ไขเมนูของร้าน “ไม้ซ่อนน้ำ” พร้อมราคาและหมวดหมู่
          </p>
        </div>
        <Link
          href="/admin"
          className="hidden md:inline-flex text-sm text-gray-500 hover:text-gray-700"
        >
          กลับไปหน้าภาพรวม
        </Link>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
              เพิ่มเมนูใหม่
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              กรอกชื่อเมนู ราคา และเลือกหมวดหมู่ให้พร้อมใช้งานในหน้าบ้าน POS
            </p>
            <MenuForm categories={categories} toppings={toppings} />
          </div>
        </section>

        <section className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                รายการเมนูทั้งหมด
              </h3>
            </div>
            <MenuList initialMenus={menus} categories={categories} toppings={toppings} />
          </div>
        </section>
      </div>
    </div>
  );
}

