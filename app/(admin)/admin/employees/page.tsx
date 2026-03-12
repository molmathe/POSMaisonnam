import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EmployeeForm from "./_EmployeeForm";
import EmployeeList from "./_EmployeeList";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการพนักงาน
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            เพิ่ม ลบ แก้ไขพนักงาน กำหนดค่าแรงรายวัน และตั้ง PIN เจ้าของร้าน
          </p>
        </div>
        <Link
          href="/admin/payroll"
          className="hidden md:inline-flex text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          ไปหน้าเงินเดือน →
        </Link>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">
              เพิ่มพนักงานใหม่
            </h3>
            <EmployeeForm />
          </div>
        </section>

        <section className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
              รายชื่อพนักงานทั้งหมด
            </h3>
            <EmployeeList initialEmployees={employees} />
          </div>
        </section>
      </div>
    </div>
  );
}
