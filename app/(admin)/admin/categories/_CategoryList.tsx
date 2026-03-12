 "use client";

import { useState } from "react";

type Category = {
  id: number;
  name: string;
};

interface Props {
  initialCategories: Category[];
}

export default function CategoryList({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function saveEdit(id: number) {
    if (!editingName.trim()) return;
    const old = categories;
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name: editingName.trim() } : c
    );
    setCategories(updated);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) {
        throw new Error();
      }
      setEditingId(null);
      setEditingName("");
    } catch {
      setCategories(old);
      alert("ไม่สามารถแก้ไขหมวดหมู่ได้");
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm("ต้องการลบหมวดหมู่นี้หรือไม่?")) return;
    const old = categories;
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error();
      }
    } catch {
      setCategories(old);
      alert("ไม่สามารถลบหมวดหมู่ได้ (อาจมีเมนูที่ผูกกับหมวดนี้อยู่)");
    }
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ทางด้านซ้าย
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 bg-white"
        >
          <div className="flex-1 mr-3">
            {editingId === category.id ? (
              <input
                className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                autoFocus
              />
            ) : (
              <span className="text-sm md:text-base text-gray-800">
                {category.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {editingId === category.id ? (
              <>
                  <button
                  onClick={() => saveEdit(category.id)}
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
                  onClick={() => startEdit(category)}
                  className="px-2 md:px-3 py-1 rounded-lg border border-orange-200 text-xs md:text-sm text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="px-2 md:px-3 py-1 rounded-lg border border-red-200 text-xs md:text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  ลบ
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

