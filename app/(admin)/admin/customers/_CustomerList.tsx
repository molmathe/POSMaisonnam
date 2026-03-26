 "use client";

import { useState } from "react";

type Customer = {
  id: number;
  name: string;
};

interface Props {
  initialCustomers: Customer[];
}

export default function CustomerList({ initialCustomers }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(item: Customer) {
    setEditingId(item.id);
    setDraft(item.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }

  async function saveEdit(id: number) {
    if (!draft.trim()) return;

    const old = customers;
    const updated = customers.map((c) =>
      c.id === id ? { ...c, name: draft.trim() } : c
    );
    setCustomers(updated);

    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
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
      setCustomers(old);
      alert("ไม่สามารถแก้ไขลูกค้าได้");
    }
  }

  async function deleteCustomer(id: number) {
    if (!confirm("ต้องการลบลูกค้ารายนี้หรือไม่?")) return;
    const old = customers;
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error();
      }
    } catch {
      setCustomers(old);
      alert("ไม่สามารถลบลูกค้าได้ (อาจมีออเดอร์ของลูกค้ารายนี้อยู่)");
    }
  }

  if (customers.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มีลูกค้าประจำ กรุณาเพิ่มทางด้านซ้าย
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {customers.map((item) => {
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
                    onClick={() => deleteCustomer(item.id)}
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

