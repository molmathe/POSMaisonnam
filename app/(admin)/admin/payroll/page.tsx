import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PayrollClient from "./_PayrollClient";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { id: "asc" },
    include: {
      attendances: {
        orderBy: { date: "desc" },
      },
    },
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            เงินเดือนและรายงาน
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">
            ดูการเข้างานรายวัน เพิ่มเงินพิเศษ และออกรายงานเงินเดือนสิ้นเดือน
          </p>
        </div>
        <Link
          href="/admin/employees"
          className="hidden md:inline-flex text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          ← จัดการพนักงาน
        </Link>
      </header>

      <PayrollClient initialEmployees={employees as any} />
    </div>
  );
}
