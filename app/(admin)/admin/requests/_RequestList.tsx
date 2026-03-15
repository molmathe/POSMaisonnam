 "use client";

import { useState } from "react";

type RequestItem = {
  id: number;
  name: string;
};

interface Props {
  initialRequests: RequestItem[];
}

export default function RequestList({ initialRequests }: Props) {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(item: RequestItem) {
    setEditingId(item.id);
    setDraft(item.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }

  async function saveEdit(id: number) {
    if (!draft.trim()) return;

    const old = requests;
    const updated = requests.map((r) =>
      r.id === id ? { ...r, name: draft.trim() } : r
    );
    setRequests(updated);

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
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
      setRequests(old);
      alert("ไม่สามารถแก้ไขคำขอพิเศษได้");
    }
  }

  async function deleteRequest(id: number) {
    if (!confirm("ต้องการลบคำขอพิเศษนี้หรือไม่?")) return;
    const old = requests;
    setRequests(requests.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRequests(old);
        alert(data.message ?? "ไม่สามารถลบคำขอพิเศษได้");
        return;
      }
    } catch {
      setRequests(old);
      alert("ไม่สามารถลบคำขอพิเศษได้");
    }
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มีคำขอพิเศษ กรุณาเพิ่มคำขอพิเศษทางด้านซ้าย
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
      {requests.map((item) => {
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
                    onClick={() => deleteRequest(item.id)}
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

