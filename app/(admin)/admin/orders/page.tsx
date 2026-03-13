"use client";

import { useState, useEffect, useCallback } from "react";

type Order = {
  id: number;
  tableId: number | null;
  customer: { id: number; name: string } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    menu: { nameTh: string };
  }[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/pending-no-table");
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบออเดอร์ #" + id + " จริงหรือไม่?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/pos/orders/${id}`, { method: "DELETE" });
      if (res.ok) await load();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "ลบไม่สำเร็จ");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          ออเดอร์ที่ไม่มีโต๊ะ
        </h2>
        <p className="text-gray-500 text-sm md:text-base mt-1">
          ออเดอร์รอชำระที่ยังไม่ได้เลือกโต๊ะ — ลบได้ถ้าเป็นออเดอร์ผิดหรือทดสอบ
        </p>
      </header>

      {loading ? (
        <p className="text-gray-500">กำลังโหลด...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          ไม่มีออเดอร์ที่ไม่มีโต๊ะ
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <span className="font-semibold text-gray-900">ออเดอร์ #{order.id}</span>
                {order.customer?.name && (
                  <span className="ml-2 text-gray-500">· {order.customer.name}</span>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {order.items.map((i) => `${i.menu.nameTh} ×${i.quantity}`).join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(order.id)}
                disabled={deletingId === order.id}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium text-sm disabled:opacity-50"
              >
                {deletingId === order.id ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
