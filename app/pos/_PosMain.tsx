"use client";

import { useState, useEffect, useCallback, type ComponentProps } from "react";
import PosMenuModal from "./_PosMenuModal";

type Table = { id: number; name: string };
type Customer = { id: number; name: string };
type Category = { id: number; name: string };
type Menu = { id: number; nameTh: string; nameEn: string | null; price: number; imageUrl: string | null; categoryId: number; allowedToppingIds?: number[] };
type Topping = { id: number; name: string; price: number };
type SpecialRequest = { id: number; name: string };
type OrderItem = {
  id: number;
  menuId: number;
  quantity: number;
  price: number;
  note: string | null;
  toppings: unknown;
  requests: unknown;
  menu: { id: number; nameTh: string; nameEn: string | null; price: number };
};

type Order = {
  id: number;
  tableId: number | null;
  customerId: number | null;
  table: Table | null;
  customer: Customer | null;
  items: OrderItem[];
};

type PosData = {
  tables: Table[];
  customers: Customer[];
  categories: Category[];
  menus: Menu[];
  toppings: Topping[];
  specialRequests: SpecialRequest[];
};

export default function PosMain({
  isOwner,
  onOpenBill,
  onOpenAttendance,
  onLogout,
}: {
  isOwner: boolean;
  onOpenBill: (tableId: number, orderId: number) => void;
  onOpenAttendance: () => void;
  onLogout: () => void;
}) {
  const [data, setData] = useState<PosData | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [menuModal, setMenuModal] = useState<Menu | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showMoveTable, setShowMoveTable] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/pos/data");
    if (res.ok) setData(await res.json());
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!tableId) {
      setCurrentOrder(null);
      return;
    }
    const res = await fetch(`/api/pos/orders?tableId=${tableId}`);
    if (res.ok) {
      const order = await res.json();
      setCurrentOrder(order);
    } else setCurrentOrder(null);
  }, [tableId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const createOrder = async () => {
    if (!tableId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, customerId }),
      });
      if (res.ok) {
        const order = await res.json();
        setCurrentOrder(order);
      }
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (menuId: number, quantity: number, toppings: { id: number; name: string; price: number }[], requests: string[], note: string | null) => {
    let orderId = currentOrder?.id;
    if (!orderId && tableId) {
      const res = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, customerId }),
      });
      if (!res.ok) return;
      const newOrder = await res.json();
      orderId = newOrder.id;
      setCurrentOrder(newOrder);
    }
    if (!orderId) return;
    setLoading(true);
    try {
      const menu = data?.menus.find((m) => m.id === menuId);
      const price = (menu?.price ?? 0) + toppings.reduce((s, t) => s + t.price, 0);
      const res = await fetch(`/api/pos/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId,
          quantity,
          toppings: toppings.map((t) => ({ id: t.id, name: t.name, price: t.price })),
          requests,
          note: note || null,
        }),
      });
      if (res.ok) {
        await fetchOrder();
        setMenuModal(null);
        setToast("เพิ่มรายการแล้ว");
        setTimeout(() => setToast(""), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number, toppings: { id: number; name: string; price: number }[], requests: string[], note: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          toppings: toppings.map((t) => ({ id: t.id, name: t.name, price: t.price })),
          requests,
          note: note || null,
        }),
      });
      if (res.ok) {
        await fetchOrder();
        setEditingItemId(null);
        setMenuModal(null);
        setToast("แก้ไขแล้ว");
        setTimeout(() => setToast(""), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm("ลบรายการนี้?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/items/${itemId}`, { method: "DELETE" });
      if (res.ok) await fetchOrder();
    } finally {
      setLoading(false);
    }
  };

  const updateOrderMeta = async (updates: { tableId?: number | null; customerId?: number | null }) => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${currentOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const order = await res.json();
        setCurrentOrder(order);
        if (updates.tableId !== undefined) setTableId(updates.tableId ?? null);
        if (updates.customerId !== undefined) setCustomerId(updates.customerId ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMenus = data?.menus.filter((m) => {
    const matchCat = !categoryId || m.categoryId === categoryId;
    const matchSearch = !search.trim() || m.nameTh.toLowerCase().includes(search.toLowerCase()) || (m.nameEn?.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  }) ?? [];

  const subtotal = currentOrder?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 flex-wrap">
        <span className="font-bold text-gray-900 text-sm md:text-base">ไม้ซ่อนน้ำ POS</span>
        <div className="relative flex-1 min-w-[100px] max-w-[140px]">
          <select
            className="w-full border border-gray-300 rounded-lg py-2 px-2 text-sm"
            value={tableId ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setTableId(v);
              setCurrentOrder(null);
              setShowMoveTable(false);
            }}
          >
            <option value="">เลือกโต๊ะ</option>
            {data.tables.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {currentOrder && (
            <button
              type="button"
              onClick={() => setShowMoveTable((s) => !s)}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-orange-500 hover:text-orange-700 font-medium"
              title="ย้ายโต๊ะ"
            >
              ย้าย
            </button>
          )}
        </div>
        {showMoveTable && currentOrder && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
            <p className="text-xs text-gray-500 px-2 py-1">ย้ายบิลไปโต๊ะ</p>
            {data.tables.filter((t) => t.id !== currentOrder.tableId).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={async () => {
                  await updateOrderMeta({ tableId: t.id });
                  setTableId(t.id);
                  setShowMoveTable(false);
                  setToast("ย้ายโต๊ะแล้ว");
                  setTimeout(() => setToast(""), 2000);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600 text-sm transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <select
          className="flex-1 min-w-[100px] max-w-[140px] border border-gray-300 rounded-lg py-2 px-2 text-sm"
          value={customerId ?? ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            setCustomerId(v);
            if (currentOrder) updateOrderMeta({ customerId: v });
          }}
        >
          <option value="">ลูกค้า (ไม่ระบุ)</option>
          {data.customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {isOwner && (
          <button
            type="button"
            onClick={onOpenAttendance}
            className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-sm font-medium hover:bg-orange-100 transition-colors"
          >
            เช็คชื่อ
          </button>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          ออก
        </button>
      </header>

      {/* Search + Categories */}
      <div className="sticky top-[52px] z-10 bg-white border-b border-gray-100 px-3 py-2 space-y-2">
        <input
          type="search"
          placeholder="ค้นหาเมนู..."
          className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!categoryId ? "bg-orange-500 text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
          >
            ทั้งหมด
          </button>
          {data.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoryId === c.id ? "bg-orange-500 text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <main className="flex-1 px-3 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredMenus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => setMenuModal(menu)}
              className="text-left rounded-2xl border border-gray-100 bg-white p-4 hover:border-orange-300 hover:shadow-md transition-all group overflow-hidden"
            >
              {menu.imageUrl && (
                <div className="aspect-square -mx-4 -mt-4 mb-3 bg-gray-100 overflow-hidden rounded-t-2xl">
                  <img
                    src={menu.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="font-medium text-gray-800 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors">
                {menu.nameTh}
              </div>
              <div className="text-xs font-semibold text-green-600 mt-1">
                ฿{menu.price.toFixed(0)}
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Cart bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm text-gray-600">
            {currentOrder ? `${currentOrder.items.length} รายการ` : "ยังไม่มีรายการ"}
          </span>
          <span className="font-semibold text-gray-900">
            รวม ฿{subtotal.toFixed(0)}
          </span>
        </div>
        <div className="flex gap-2">
          {!currentOrder && tableId && (
            <button
              type="button"
              onClick={createOrder}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium shadow-sm transition-colors"
            >
              เปิดบิล
            </button>
          )}
          {currentOrder && (
            <>
              <button
                type="button"
                onClick={() => currentOrder.tableId && onOpenBill(currentOrder.tableId, currentOrder.id)}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium shadow-sm transition-colors"
              >
                เช็คบิล
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cart drawer / list - inline for mobile: show items in a collapsible or always visible small list */}
      {currentOrder && currentOrder.items.length > 0 && (
        <div className="fixed left-0 right-0 bottom-[88px] max-h-[40vh] overflow-y-auto bg-white border-t border-gray-100 px-3 py-2">
          <p className="text-xs font-medium text-gray-500 mb-2">รายการสั่ง</p>
          <ul className="space-y-1.5">
            {currentOrder.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900">{item.menu.nameTh}</span>
                  <span className="text-gray-500 ml-1">x{item.quantity}</span>
                  {item.note && <span className="block text-xs text-gray-400 truncate">{item.note}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">฿{(item.price * item.quantity).toFixed(0)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const menu = data.menus.find((m) => m.id === item.menuId);
                      if (menu) {
                        setEditingItemId(item.id);
                        setMenuModal({ ...menu } as Menu);
                      }
                    }}
                    className="text-orange-500 hover:text-orange-600 font-medium text-xs px-2 py-1 rounded bg-orange-50"
                  >
                    แก้
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600 font-medium text-xs px-2 py-1 rounded bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {menuModal && (
        <PosMenuModal
          menu={menuModal}
          toppings={data.toppings}
          specialRequests={data.specialRequests}
          editingItemId={editingItemId}
          currentItem={editingItemId ? (currentOrder?.items.find((i) => i.id === editingItemId) as ComponentProps<typeof PosMenuModal>["currentItem"]) ?? undefined : undefined}
          onAdd={addItem}
          onUpdate={updateItem}
          onClose={() => {
            setMenuModal(null);
            setEditingItemId(null);
          }}
          loading={loading}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm shadow-lg font-medium tracking-wide">
          {toast}
        </div>
      )}
    </div>
  );
}
