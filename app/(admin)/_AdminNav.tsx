"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "ภาพรวม", icon: "📊" },
  { href: "/admin/menus", label: "เมนูอาหาร", icon: "🍽" },
  { href: "/admin/categories", label: "หมวดหมู่", icon: "📂" },
  { href: "/admin/toppings", label: "Topping", icon: "🧂" },
  { href: "/admin/requests", label: "คำขอพิเศษ", icon: "💬" },
  { href: "/admin/tables", label: "โต๊ะ", icon: "🪑" },
  { href: "/admin/customers", label: "ลูกค้าประจำ", icon: "👥" },
  { href: "/admin/employees", label: "พนักงาน", icon: "👤" },
  { href: "/admin/payroll", label: "เงินเดือน", icon: "💰" },
  { href: "/admin/reports", label: "รายงาน", icon: "📈" },
  { href: "/admin/settings", label: "ตั้งค่า", icon: "⚙️" },
  { href: "/admin/orders", label: "ออเดอร์ที่ไม่มีโต๊ะ", icon: "🗑" },
  { href: "/order-monitor", label: "จอคิวออเดอร์", icon: "📺", external: true },
];

export default function AdminNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          aria-label="เปิดเมนู"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="6" x2="20" y2="6" />
            <line x1="2" y1="11" x2="20" y2="11" />
            <line x1="2" y1="16" x2="20" y2="16" />
          </svg>
        </button>

        <span className="font-semibold text-gray-800 text-sm">
          {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "ไม้ซ่อนน้ำ Admin"}
        </span>

        <Link
          href="/pos"
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 transition-colors"
        >
          ← POS
        </Link>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100">
              <span className="font-bold text-gray-800">ไม้ซ่อนน้ำ Admin</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href;
                  const isExternal = "external" in item && (item as { external?: boolean }).external;
                  const baseClass = `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`;
                  return (
                    <li key={item.href}>
                      {isExternal ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpen(false)}
                          className={baseClass}
                        >
                          <span className="text-lg leading-none">{item.icon}</span>
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={baseClass}
                        >
                          <span className="text-lg leading-none">{item.icon}</span>
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Back to POS */}
            <div className="p-4 border-t border-gray-100">
              <Link
                href="/pos"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors"
              >
                ← กลับไปหน้า POS
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
