 "use client";

import { useState } from "react";

type TableItem = {
  id: number;
  name: string;
};

interface Props {
  initialTables: TableItem[];
}

export default function TableList({ initialTables }: Props) {
  const [tables, setTables] = useState<TableItem[]>(initialTables);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(item: TableItem) {
    setEditingId(item.id);
    setDraft(item.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }

  async function saveEdit(id: number) {
    if (!draft.trim()) return;

    const old = tables;
    const updated = tables.map((t) =>
      t.id === id ? { ...t, name: draft.trim() } : t
    );
    setTables(updated);

    try {
      const res = await fetch(`/api/admin/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.trim() }),
      });
      if (!res.ok) {
        throw new Error();
      }
      setEditingId(null);
      setDraft("");
    } catch {
      setTables(old);
      alert("ไม่สามารถแก้ไขโต๊ะได้");
    }
  }

  async function deleteTable(id: number) {
    if (!confirm("ต้องการลบโต๊ะนี้หรือไม่?")) return;
    const old = tables;
    const updated = tables.filter((t) => t.id !== id);
    setTables(updated);
    try {
      const res = await fetch(`/api/admin/tables/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error();
      }
    } catch {
      setTables(old);
      alert("ไม่สามารถลบโต๊ะได้ (อาจมีออเดอร์ที่ผูกกับโต๊ะนี้อยู่)");
    }
  }

  if (tables.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มีโต๊ะ กรุณาเพิ่มโต๊ะทางด้านซ้าย
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {tables.map((item) => {
        const isEditing = editingId === item.id;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 bg-white"
          >
            <div className="flex-1 mr-3">
              {isEditing ? (
                <input
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                />
              ) : (
                <span className="text-sm md:text-base text-gray-800">
                  {item.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {isEditing ? (
                <>
                  <button
                    onClick={() => saveEdit(item.id)}
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
                    onClick={() => startEdit(item)}
                    className="px-2 md:px-3 py-1 rounded-lg border border-orange-200 text-xs md:text-sm text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteTable(item.id)}
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

