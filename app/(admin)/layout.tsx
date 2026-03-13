import "../globals.css";
import Link from "next/link";
import AdminNav from "./_AdminNav";

const SIDEBAR_ITEMS = [
  { group: null, href: "/admin", label: "📊 ภาพรวม" },
  { group: "เมนู & สินค้า", href: "/admin/menus", label: "🍽 เมนูอาหาร" },
  { group: "เมนู & สินค้า", href: "/admin/categories", label: "📂 หมวดหมู่" },
  { group: "เมนู & สินค้า", href: "/admin/toppings", label: "🧂 Topping" },
  { group: "เมนู & สินค้า", href: "/admin/requests", label: "💬 คำขอพิเศษ" },
  { group: "เมนู & สินค้า", href: "/admin/tables", label: "🪑 โต๊ะ" },
  { group: "เมนู & สินค้า", href: "/admin/customers", label: "👥 ลูกค้าประจำ" },
  { group: "พนักงาน", href: "/admin/employees", label: "👤 พนักงาน" },
  { group: "พนักงาน", href: "/admin/payroll", label: "💰 เงินเดือน" },
  { group: "ตั้งค่า", href: "/admin/reports", label: "📈 รายงาน" },
  { group: "ตั้งค่า", href: "/admin/settings", label: "⚙️ ตั้งค่า" },
  { group: "ตั้งค่า", href: "/admin/orders", label: "🗑 ออเดอร์ที่ไม่มีโต๊ะ" },
  { group: "จอแสดงผล", href: "/order-monitor", label: "📺 จอคิวออเดอร์", external: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const groups = ["เมนู & สินค้า", "พนักงาน", "ตั้งค่า", "จอแสดงผล"];

  return (
    <div className="bg-gray-50 text-gray-800 font-sans antialiased min-h-screen">
      <div className="flex min-h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="w-60 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="h-14 flex items-center px-4 border-b border-gray-200">
            <h1 className="text-base font-bold text-gray-800">ไม้ซ่อนน้ำ Admin</h1>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-3">
            {/* Top-level (no group) */}
            {SIDEBAR_ITEMS.filter((i) => !i.group).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium mb-1"
              >
                {item.label}
              </Link>
            ))}

            {groups.map((group) => (
              <div key={group} className="mt-3">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-orange-400 mb-1">
                  {group}
                </p>
                {SIDEBAR_ITEMS.filter((i) => i.group === group).map((item) => {
                  const isExternal = "external" in item && (item as { external?: boolean }).external;
                  return isExternal ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors font-medium"
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-200">
            <Link
              href="/pos"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
            >
              ← กลับไปหน้า POS
            </Link>
          </div>
        </aside>

        {/* Mobile nav (client component) + main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminNav />
          <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

