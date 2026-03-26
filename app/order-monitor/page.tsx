"use client";

import { useState, useEffect, useCallback } from "react";

type Order = {
  id: number;
  tableId: number | null;
  table: { id: number; name: string } | null;
  customer: { id: number; name: string } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    note: string | null;
    toppings: unknown;
    requests: unknown;
    sentToKitchen: boolean;
    kitchenPreparedCount: number;
    kitchenPreparedAt: string | null;
    menu: { id: number; nameTh: string; nameEn: string | null };
  }[];
};

export default function OrderMonitorPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/pos/monitor/orders");
      if (res.ok) setOrders(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 5000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const markPrepared = useCallback(async (itemId: number) => {
    setMarkingId(itemId);
    try {
      const res = await fetch(`/api/pos/monitor/items/${itemId}/prepared`, { method: "POST" });
      if (res.ok) await fetchOrders();
    } finally {
      setMarkingId(null);
    }
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400 text-xl">
        กำลังโหลดคิวออเดอร์...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <header className="text-center mb-4 md:mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-orange-400">ไม้ซ่อนน้ำ</h1>
        <p className="text-sm md:text-lg text-gray-400 mt-1">คิวออเดอร์ · Order Queue</p>
        <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
          <span className="text-orange-400 font-medium">ใหม่</span> = ยังไม่ส่งครัว · กด <span className="text-emerald-300 font-medium">ทำแล้ว</span> ทีละจาน · แสดง <span className="text-emerald-300 font-medium">ทำ X แล้ว เหลือ Y</span> จนเหลือ 0 = ครัวทำแล้ว
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <p className="text-4xl md:text-6xl mb-4">🍽</p>
          <p className="text-lg md:text-xl">ยังไม่มีออเดอร์ในคิว</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {orders.map((order) => {
            const newCount = order.items.filter((i) => !i.sentToKitchen).length;
            const allSent = newCount === 0;
            const sentItems = order.items.filter((i) => i.sentToKitchen);
            const itemFullyPrepared = (i: Order["items"][0]) =>
              (i.kitchenPreparedCount ?? 0) >= i.quantity || !!i.kitchenPreparedAt;
            const fullyPreparedLineCount = order.items.filter(itemFullyPrepared).length;
            const remainingPlates = sentItems.reduce(
              (sum, i) => sum + Math.max(0, i.quantity - (i.kitchenPreparedCount ?? 0)),
              0
            );
            const allPrepared = sentItems.length > 0 && fullyPreparedLineCount === sentItems.length;
            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 overflow-hidden shadow-lg ${
                  allPrepared
                    ? "bg-gray-800/60 border-emerald-500/50"
                    : allSent
                    ? "bg-gray-800/80 border-green-500/40"
                    : "bg-gray-800 border-orange-500/50"
                }`}
              >
                <div className={`px-4 py-3 border-b flex items-center justify-between flex-wrap gap-1 ${
                  allPrepared ? "bg-emerald-500/20 border-emerald-500/30" : allSent ? "bg-green-500/20 border-green-500/30" : "bg-orange-500/20 border-orange-500/30"
                }`}>
                  <span className={`text-xl md:text-2xl font-bold ${
                    allPrepared ? "text-emerald-300" : allSent ? "text-green-400" : "text-orange-400"
                  }`}>
                    {order.table?.name ?? "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    {allPrepared ? (
                      <span className="text-xs font-semibold text-emerald-200 bg-emerald-500/40 px-2 py-0.5 rounded">
                        ครัวทำครบแล้ว
                      </span>
                    ) : allSent ? (
                      <span className="text-xs font-semibold text-green-300 bg-green-500/30 px-2 py-0.5 rounded">
                        ส่งครัวครบ · รอทำ {remainingPlates} จาน
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-orange-300 bg-orange-500/30 px-2 py-0.5 rounded">
                        มีรายการใหม่ {newCount}
                      </span>
                    )}
                    <span className="text-sm text-gray-400">#{order.id}</span>
                  </div>
                </div>
                {order.customer?.name && (
                  <div className="px-4 py-1.5 bg-gray-800/80 border-b border-gray-700 text-sm text-gray-400">
                    {order.customer.name}
                  </div>
                )}
                <ul className="p-4 space-y-2">
                  {order.items.map((item) => {
                    const tops = Array.isArray(item.toppings)
                      ? (item.toppings as { name: string }[]).map((t) => t.name)
                      : [];
                    const reqs = Array.isArray(item.requests) ? (item.requests as string[]) : [];
                    const isNew = !item.sentToKitchen;
                    const preparedCount = item.kitchenPreparedCount ?? 0;
                    const isFullyPrepared = preparedCount >= item.quantity || !!item.kitchenPreparedAt;
                    const isPartial = !isNew && !isFullyPrepared && preparedCount > 0;
                    return (
                      <li
                        key={item.id}
                        className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5 pl-2 ${
                          isNew
                            ? "border-l-2 border-orange-400"
                            : isPartial
                            ? "border-l-2 border-orange-400 bg-orange-500/10"
                            : isFullyPrepared
                            ? "border-l-2 border-emerald-500/60 opacity-95"
                            : "opacity-90"
                        }`}
                      >
                        {isNew && (
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/30 px-1.5 py-0.5 rounded mr-1">
                            ใหม่
                          </span>
                        )}
                        {!isNew && !isFullyPrepared && (
                          <button
                            type="button"
                            onClick={() => markPrepared(item.id)}
                            disabled={markingId === item.id}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded mr-1 disabled:opacity-50 ${
                              isPartial
                                ? "text-orange-300 bg-orange-500/40 hover:bg-orange-500/60"
                                : "text-emerald-300 bg-emerald-500/40 hover:bg-emerald-500/60"
                            }`}
                          >
                            {markingId === item.id ? "..." : "ทำแล้ว"}
                          </button>
                        )}
                        {!isNew && (isFullyPrepared || isPartial) && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-1 ${
                            isPartial ? "text-orange-300 bg-orange-500/30" : "text-emerald-300 bg-emerald-500/30"
                          }`}>
                            {isFullyPrepared ? "ครัวทำแล้ว" : `ทำ ${preparedCount} แล้ว เหลือ ${item.quantity - preparedCount}`}
                          </span>
                        )}
                        <span className="text-lg md:text-xl font-semibold text-white">
                          {item.menu.nameTh}
                        </span>
                        <span className="text-orange-400 font-medium">×{item.quantity}</span>
                        {!isNew && !isFullyPrepared && item.quantity > 1 && (
                          <span className={`text-[11px] ${isPartial ? "text-orange-300/90" : "text-gray-400"}`}>(เหลือ {item.quantity - preparedCount} จาน)</span>
                        )}
                        {tops.length > 0 && (
                          <span className="text-sm text-amber-300">+ {tops.join(", ")}</span>
                        )}
                        {reqs.length > 0 && (
                          <span className="text-sm text-amber-200/80">★ {reqs.join(", ")}</span>
                        )}
                        {item.note && (
                          <span className="text-sm text-gray-400 block w-full">หมายเหตุ: {item.note}</span>
                        )}
                        {!isNew && !isFullyPrepared && preparedCount === 0 && (
                          <span className="text-[10px] text-gray-500 ml-1">(ส่งแล้ว รอทำ)</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-gray-500 text-xs mt-6">
        อัปเดตอัตโนมัติทุก 5 วินาที
      </p>
    </div>
  );
}
