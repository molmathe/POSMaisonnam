import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TableForm from "./_TableForm";
import TableList from "./_TableList";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const tables = await prisma.table.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการโต๊ะในร้าน
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            เพิ่ม ลบ แก้ไขชื่อโต๊ะ เช่น โต๊ะ 1 โต๊ะ 2 โซนสวน 1
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
              เพิ่มโต๊ะใหม่
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              ตั้งชื่อให้จำง่าย เช่น โต๊ะ 1, โต๊ะในสวน, ห้อง VIP
            </p>
            <TableForm />
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                รายการโต๊ะทั้งหมด
              </h3>
            </div>
            <TableList initialTables={tables} />
          </div>
        </section>
      </div>
    </div>
  );
}

