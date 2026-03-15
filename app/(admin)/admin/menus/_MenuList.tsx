"use client";

import { useState } from "react";
import { getMenuImageUrl } from "@/lib/get-menu-image-url";
import MenuEditModal from "./_MenuEditModal";

type Category = { id: number; name: string };
type Topping = { id: number; name: string; price: number; group?: string | null };
type SpecialRequest = { id: number; name: string };
type Menu = {
  id: number;
  nameTh: string;
  nameEn: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: number;
  category?: Category;
  allowedToppingIds?: number[];
  allowedRequestIds?: number[];
};

interface Props {
  initialMenus: Menu[];
  categories: Category[];
  toppings: Topping[];
  specialRequests: SpecialRequest[];
}

export default function MenuList({ initialMenus, categories, toppings, specialRequests }: Props) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  function handleSaved(updated: Menu) {
    setMenus((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    );
    setEditingMenu(null);
  }

  async function deleteMenu(id: number) {
    if (!confirm("ต้องการลบเมนูนี้หรือไม่?")) return;
    const old = menus;
    setMenus((prev) => prev.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/admin/menus/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setMenus(old);
      alert("ไม่สามารถลบเมนูได้ (อาจมีออเดอร์ที่ใช้เมนูนี้อยู่)");
    }
  }

  if (menus.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มีเมนู กรุณาเพิ่มเมนูทางด้านซ้าย
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {menus.map((menu) => {
          const toppingCount = menu.allowedToppingIds?.length ?? 0;
          const requestCount = menu.allowedRequestIds?.length ?? 0;
          const summaryParts: string[] = [];
          if (toppingCount > 0) summaryParts.push(`Topping ${toppingCount}`);
          if (requestCount > 0) summaryParts.push(`คำขอ ${requestCount}`);
          const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : null;

          return (
            <div
              key={menu.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl px-3 md:px-4 py-2.5 md:py-3 bg-white gap-2"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {menu.imageUrl ? (
                  <img
                    src={getMenuImageUrl(menu.imageUrl)}
                    alt={menu.nameTh}
                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 flex-shrink-0 bg-gray-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-gray-200 bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 text-lg">
                    🍽
                  </div>
                )}
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm md:text-base font-medium text-gray-900">
                      {menu.nameTh}
                    </span>
                    {menu.nameEn && (
                      <span className="text-xs text-gray-500">({menu.nameEn})</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>฿{menu.price.toFixed(0)}</span>
                    {menu.category && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {menu.category.name}
                      </span>
                    )}
                    {summary && (
                      <span className="text-gray-400">{summary}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingMenu(menu)}
                  className="px-2 md:px-3 py-1 rounded-lg border border-orange-200 text-xs md:text-sm text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => deleteMenu(menu.id)}
                  className="px-2 md:px-3 py-1 rounded-lg border border-red-200 text-xs md:text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingMenu && (
        <MenuEditModal
          menu={editingMenu}
          categories={categories}
          toppings={toppings}
          specialRequests={specialRequests}
          onClose={() => setEditingMenu(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
