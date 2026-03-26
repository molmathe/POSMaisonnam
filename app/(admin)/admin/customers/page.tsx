import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CustomerForm from "./_CustomerForm";
import CustomerList from "./_CustomerList";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            ลูกค้าประจำ
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            เพิ่ม ลบ แก้ไขชื่อลูกค้าประจำ เพื่อเลือกได้เร็วในหน้าบ้าน POS
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
              เพิ่มลูกค้าประจำใหม่
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              ใส่ชื่อเล่นหรือชื่อลูกค้าที่ใช้บ่อย
            </p>
            <CustomerForm />
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-800">
                รายชื่อลูกค้าประจำ
              </h3>
            </div>
            <CustomerList initialCustomers={customers} />
          </div>
        </section>
      </div>
    </div>
  );
}

