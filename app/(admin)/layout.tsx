import "../globals.css";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 text-gray-800 font-sans antialiased min-h-screen">
      <div className="flex min-h-screen overflow-hidden">
        {/* Sidebar สำหรับ iPad (กว้าง 256px) */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">
              ไม้ซ่อนน้ำ POS
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">ภาพรวม (Dashboard)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/categories"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">จัดการหมวดหมู่</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/menus"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">จัดการเมนูอาหาร</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/toppings"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">จัดการ Topping</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/requests"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">จัดการคำขอพิเศษ</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/tables"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">จัดการโต๊ะ</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/customers"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">ลูกค้าประจำ</span>
                </Link>
              </li>
              <li className="pt-2">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-orange-400 mb-1">
                  พนักงาน
                </p>
              </li>
              <li>
                <Link
                  href="/admin/employees"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">จัดการพนักงาน</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/payroll"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">เงินเดือนและรายงาน</span>
                </Link>
              </li>
              <li className="pt-2">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-orange-400 mb-1">
                  ตั้งค่าระบบ
                </p>
              </li>
              <li>
                <Link
                  href="/admin/settings"
                  className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <span className="font-medium">ตั้งค่าบิลและชำระเงิน</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              ระบบจัดการหลังบ้าน
            </div>
          </div>
        </aside>

        {/* Top bar + content สำหรับมือถือ / iPad แนวตั้ง */}
        <div className="flex-1 flex flex-col">
          <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <span className="text-base font-semibold text-gray-800">
              ไม้ซ่อนน้ำ POS
            </span>
            <Link
              href="/admin"
              className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600"
            >
              Dashboard
            </Link>
          </header>

          <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

