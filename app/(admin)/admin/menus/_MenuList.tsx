 "use client";

import { useState } from "react";

type Category = {
  id: number;
  name: string;
};

type Topping = { id: number; name: string; price: number };

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<Menu> & { toppingIds?: number[]; requestIds?: number[] }>({});

  function startEdit(menu: Menu) {
    setEditingId(menu.id);
    setDraft({
      nameTh: menu.nameTh,
      nameEn: menu.nameEn ?? "",
      price: menu.price,
      imageUrl: menu.imageUrl ?? "",
      categoryId: menu.categoryId,
      toppingIds: menu.allowedToppingIds ?? [],
      requestIds: menu.allowedRequestIds ?? [],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  function updateDraft(field: keyof Menu, value: any) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEdit(id: number) {
    if (!draft.nameTh || !draft.price || !draft.categoryId) return;
    const numericPrice = Number(draft.price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      alert("กรุณากรอกราคาให้ถูกต้อง");
      return;
    }

    const old = menus;
    const toppingIds = Array.isArray(draft.toppingIds) ? draft.toppingIds : [];
    const requestIds = Array.isArray(draft.requestIds) ? draft.requestIds : [];
    const updatedMenus = menus.map((m) =>
      m.id === id
        ? {
            ...m,
            nameTh: String(draft.nameTh),
            nameEn: (draft.nameEn as string) || null,
            price: numericPrice,
            imageUrl: (draft.imageUrl as string) || null,
            categoryId: Number(draft.categoryId),
            category:
              categories.find((c) => c.id === Number(draft.categoryId)) ?? m.category,
            allowedToppingIds: toppingIds,
            allowedRequestIds: requestIds,
          }
        : m
    );
    setMenus(updatedMenus);

    try {
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameTh: draft.nameTh,
          nameEn: draft.nameEn || null,
          price: numericPrice,
          categoryId: draft.categoryId,
          imageUrl: draft.imageUrl || null,
          toppingIds: Array.isArray(draft.toppingIds) ? draft.toppingIds : [],
          requestIds: Array.isArray(draft.requestIds) ? draft.requestIds : [],
        }),
      });
      if (!res.ok) {
        throw new Error();
      }
      setEditingId(null);
      setDraft({});
    } catch {
      setMenus(old);
      alert("ไม่สามารถแก้ไขเมนูได้");
    }
  }

  async function deleteMenu(id: number) {
    if (!confirm("ต้องการลบเมนูนี้หรือไม่?")) return;
    const old = menus;
    const updated = menus.filter((m) => m.id !== id);
    setMenus(updated);
    try {
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error();
      }
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
    <div className="space-y-2">
      {menus.map((menu) => {
        const isEditing = editingId === menu.id;
        return (
          <div
            key={menu.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl px-3 md:px-4 py-2.5 md:py-3 bg-white gap-2"
          >
            <div className="flex-1 space-y-1">
              {isEditing ? (
                <>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                    value={draft.nameTh ?? ""}
                    onChange={(e) =>
                      updateDraft("nameTh", e.target.value || "")
                    }
                    placeholder="ชื่อเมนู (ไทย)"
                  />
                  <input
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-700 mb-1 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                    value={(draft.nameEn as string) ?? ""}
                    onChange={(e) =>
                      updateDraft("nameEn", e.target.value || "")
                    }
                    placeholder="ชื่อเมนู (อังกฤษ - ไม่บังคับ)"
                  />
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="number"
                      min={0}
                      step="1"
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                      value={draft.price ?? ""}
                      onChange={(e) =>
                        updateDraft("price", e.target.value || "")
                      }
                      placeholder="ราคา"
                    />
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                      value={draft.categoryId ?? ""}
                      onChange={(e) =>
                        updateDraft(
                          "categoryId",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    >
                      <option value="">หมวดหมู่</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                      value={(draft.imageUrl as string) ?? ""}
                      onChange={(e) =>
                        updateDraft("imageUrl", e.target.value || "")
                      }
                      placeholder="รูปภาพ (URL หรือ /uploads/...)"
                    />
                    <label className="text-[11px] text-gray-600 px-2 py-1 rounded border border-gray-300 bg-white cursor-pointer hover:bg-gray-50">
                      เปลี่ยนรูป
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const form = new FormData();
                            form.append("file", f);
                            const res = await fetch("/api/admin/uploads", {
                              method: "POST",
                              body: form,
                            });
                            if (!res.ok) {
                              alert("อัปโหลดรูปภาพไม่สำเร็จ");
                              return;
                            }
                            const data = await res.json();
                            setDraft((prev) => ({
                              ...prev,
                              imageUrl: data.url as string,
                            }));
                          } catch {
                            alert("อัปโหลดรูปภาพไม่สำเร็จ");
                          } finally {
                            e.target.value = "";
                          }
                        }}
                      />
                    </label>
                  </div>
                  {(draft.imageUrl as string)?.trim() && (
                    <div className="mt-1.5">
                      <p className="text-[11px] text-gray-500 mb-0.5">ตัวอย่างรูปเมนู</p>
                      <img
                        src={(draft.imageUrl as string).trim()}
                        alt="ตัวอย่างรูปเมนู"
                        className="h-20 w-auto max-w-[160px] rounded-md border border-gray-200 object-cover bg-gray-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  {toppings.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-500 w-full">Topping:</span>
                      {toppings.map((t) => {
                        const ids = draft.toppingIds ?? [];
                        const checked = ids.includes(t.id);
                        return (
                          <label key={t.id} className="inline-flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setDraft((p) => ({
                                  ...p,
                                  toppingIds: checked
                                    ? ids.filter((id) => id !== t.id)
                                    : [...ids, t.id],
                                }))
                              }
                              className="rounded border-gray-300"
                            />
                            <span>{t.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {specialRequests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-500 w-full">คำขอพิเศษ:</span>
                      {specialRequests.map((r) => {
                        const ids = draft.requestIds ?? [];
                        const checked = ids.includes(r.id);
                        return (
                          <label key={r.id} className="inline-flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setDraft((p) => ({
                                  ...p,
                                  requestIds: checked
                                    ? ids.filter((id) => id !== r.id)
                                    : [...ids, r.id],
                                }))
                              }
                              className="rounded border-gray-300"
                            />
                            <span>{r.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-medium text-gray-900">
                      {menu.nameTh}
                    </span>
                    {menu.nameEn && (
                      <span className="text-xs text-gray-500">
                        ({menu.nameEn})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>ราคา: ฿{menu.price.toFixed(0)}</span>
                    {menu.category && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {menu.category.name}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 md:self-start">
              {isEditing ? (
                <>
                  <button
                    onClick={() => saveEdit(menu.id)}
                    className="px-2 md:px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-medium transition-colors"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-2 md:px-3 py-1 rounded-lg border border-gray-200 text-xs md:text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(menu)}
                    className="px-2 md:px-3 py-1 rounded-lg border border-orange-200 text-xs md:text-sm text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteMenu(menu.id)}
                    className="px-2 md:px-3 py-1 rounded-lg border border-red-200 text-xs md:text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    ลบ
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

