import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CategoryForm from "./_CategoryForm";
import CategoryList from "./_CategoryList";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการหมวดหมู่เมนู
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            เพิ่ม ลบ แก้ไขหมวดหมู่สำหรับอาหารและเครื่องดื่มในร้าน “ไม้ซ่อนน้ำ”
          </p>
        </div>
        <Link
          href="/admin"
          className="hidden md:inline-flex text-sm text-gray-500 hover:text-gray-700"
        >
          กลับไปหน้าภาพรวม
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
              เพิ่มหมวดหมู่ใหม่
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              เช่น อาหารจานหลัก, ทานเล่น, ของหวาน, น้ำ, น้ำอัดลม, ไวน์, อิตาเลียนโซดา
            </p>
            <CategoryForm />
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                รายการหมวดหมู่ทั้งหมด
              </h3>
            </div>
            <CategoryList initialCategories={categories} />
          </div>
        </section>
      </div>
    </div>
  );
}

