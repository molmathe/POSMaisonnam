"use client";

import { useState, useEffect, useCallback } from "react";

type ActiveOrder = {
  id: number;
  tableId: number | null;
  table: { id: number; name: string } | null;
  customer: { id: number; name: string } | null;
  items: { price: number; quantity: number; sentToKitchen: boolean }[];
};

export default function PosOrders({
  onOpenBill,
}: {
  onOpenBill: (tableId: number, orderId: number) => void;
}) {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/orders");
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">ออเดอร์ที่เปิดอยู่</h2>
        <button
          type="button"
          onClick={load}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium px-3 py-1 rounded-lg border border-orange-200 bg-orange-50"
        >
          รีเฟรช
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-400 text-center py-10">กำลังโหลด...</p>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🍽</p>
          <p className="text-sm">ยังไม่มีออเดอร์ที่เปิดอยู่</p>
        </div>
      )}

      <div className="space-y-2">
        {orders.map((order) => {
          const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
          const unsent = order.items.filter((i) => !i.sentToKitchen).length;
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => {
                if (order.tableId) onOpenBill(order.tableId, order.id);
              }}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 px-4 py-3 hover:border-orange-300 hover:shadow-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 text-base">
                    {order.table?.name ?? "ไม่มีโต๊ะ"}
                  </span>
                  {order.customer?.name && (
                    <span className="ml-2 text-sm text-gray-500">· {order.customer.name}</span>
                  )}
                </div>
                <span className="font-bold text-green-600">฿{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{order.items.length} รายการ</span>
                {unsent > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                    ยังไม่ส่งครัว {unsent}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
