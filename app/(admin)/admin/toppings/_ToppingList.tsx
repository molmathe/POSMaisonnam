 "use client";

import { useState } from "react";

type Topping = {
  id: number;
  name: string;
  price: number;
  group?: string | null;
};

interface Props {
  initialToppings: Topping[];
}

export default function ToppingList({ initialToppings }: Props) {
  const [toppings, setToppings] = useState<Topping[]>(initialToppings);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ name?: string; price?: number | string; group?: string }>({});

  function startEdit(t: Topping) {
    setEditingId(t.id);
    setDraft({ name: t.name, price: t.price, group: t.group ?? "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  async function saveEdit(id: number) {
    if (!draft.name || draft.price === undefined || draft.price === "") return;
    const numericPrice = Number(draft.price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      alert("กรุณากรอกราคาให้ถูกต้อง");
      return;
    }

    const old = toppings;
    const groupVal = typeof draft.group === "string" ? draft.group.trim() || null : null;
    const updated = toppings.map((t) =>
      t.id === id
        ? { ...t, name: String(draft.name), price: numericPrice, group: groupVal }
        : t
    );
    setToppings(updated);

    try {
      const res = await fetch(`/api/admin/toppings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          price: numericPrice,
          group: groupVal ?? undefined,
        }),
      });
      if (!res.ok) {
        throw new Error();
      }
      setEditingId(null);
      setDraft({});
    } catch {
      setToppings(old);
      alert("ไม่สามารถแก้ไข Topping ได้");
    }
  }

  async function deleteTopping(id: number) {
    if (!confirm("ต้องการลบ Topping นี้หรือไม่?")) return;
    const old = toppings;
    setToppings(toppings.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/admin/toppings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setToppings(old);
        alert(data.message ?? "ไม่สามารถลบ Topping ได้");
        return;
      }
    } catch {
      setToppings(old);
      alert("ไม่สามารถลบ Topping ได้");
    }
  }

  if (toppings.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มี Topping กรุณาเพิ่ม Topping ทางด้านซ้าย
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {toppings.map((topping) => {
        const isEditing = editingId === topping.id;
        return (
          <div
            key={topping.id}
            className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 bg-white"
          >
            <div className="flex-1 mr-3">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className="flex-1 min-w-[120px] border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                      value={draft.name ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, name: e.target.value || "" }))
                      }
                      placeholder="ชื่อ Topping"
                    />
                    <input
                      type="number"
                      min={0}
                      step="1"
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                      value={draft.price ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, price: e.target.value || "" }))
                      }
                      placeholder="ราคา"
                    />
                  </div>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                    value={draft.group ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, group: e.target.value }))
                    }
                    placeholder="กลุ่ม (ไม่บังคับ)"
                  />
                </div>
              ) : (
                <>
                  <div className="text-sm md:text-base text-gray-800">
                    {topping.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    ราคาเพิ่ม ฿{topping.price.toFixed(0)}
                    {topping.group && (
                      <span className="text-gray-400">· กลุ่ม: {topping.group}</span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isEditing ? (
                <>
                  <button
                    onClick={() => saveEdit(topping.id)}
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
                    onClick={() => startEdit(topping)}
                    className="px-2 md:px-3 py-1 rounded-lg border border-orange-200 text-xs md:text-sm text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteTopping(topping.id)}
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

