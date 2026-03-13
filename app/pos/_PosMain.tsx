"use client";

import { useState, useEffect, useCallback, type ComponentProps } from "react";
import PosMenuModal from "./_PosMenuModal";
import { printKitchenTicket } from "@/lib/pos-print";

type Table = { id: number; name: string };
type Customer = { id: number; name: string };
type Category = { id: number; name: string };
type Menu = { id: number; nameTh: string; nameEn: string | null; price: number; imageUrl: string | null; categoryId: number; allowedToppingIds?: number[]; allowedRequestIds?: number[] };
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
  sentToKitchen: boolean;
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
  employeeName,
  onOpenBill,
  onOpenAttendance,
  onLogout,
}: {
  isOwner: boolean;
  employeeName: string | null;
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
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

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
        body: JSON.stringify({ tableId, customerId, servedBy: employeeName }),
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
        body: JSON.stringify({ tableId, customerId, servedBy: employeeName }),
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
  const newItemsCount = currentOrder?.items.filter((i) => !i.sentToKitchen).length ?? 0;

  const handleKitchen = async () => {
    if (!currentOrder?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${currentOrder.id}/kitchen`, { method: "POST" });
      const json = await res.json();
      await fetchOrder();
      if (Array.isArray(json.items) && json.items.length > 0) {
        printKitchenTicket(json.order, json.items, employeeName);
      }
      setToast("ส่งเข้าครัวแล้ว");
      setTimeout(() => setToast(""), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-40 bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        {/* Row 1: brand + actions */}
        <div className="px-4 h-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-gray-900 text-[13px] shrink-0">ไม้ซ่อนน้ำ</span>
            {employeeName && (
              <>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-[12px] text-orange-500 font-medium truncate">{employeeName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isOwner && (
              <button
                type="button"
                onClick={onOpenAttendance}
                className="text-[12px] font-semibold text-orange-500 active:opacity-60"
              >
                เช็คชื่อ
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="text-[12px] font-semibold text-red-400 active:opacity-60"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Row 2: table + move btn + customer */}
        <div className="px-5 pb-2 flex items-center gap-2">
          {/* Table picker button */}
          <button
            type="button"
            onClick={() => setShowTablePicker(true)}
            className="flex-1 h-7 border border-gray-200 rounded-lg text-[11px] bg-gray-50 font-medium flex items-center justify-center gap-1 transition-colors active:bg-gray-100"
          >
            <span className={tableId ? "text-gray-800" : "text-gray-400"}>
              {tableId ? (data.tables.find((t) => t.id === tableId)?.name ?? "เลือกโต๊ะ") : "เลือกโต๊ะ"}
            </span>
            <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {/* Move table button */}
          <button
            type="button"
            disabled={!currentOrder}
            onClick={() => setShowMoveTable(true)}
            className={`h-7 w-9 shrink-0 rounded-lg text-[10px] font-semibold border transition-colors ${
              currentOrder
                ? "bg-orange-50 text-orange-500 border-orange-200 active:bg-orange-100"
                : "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
            }`}
          >
            ย้าย
          </button>

          {/* Customer picker button */}
          <button
            type="button"
            onClick={() => setShowCustomerPicker(true)}
            className="flex-1 h-7 border border-gray-200 rounded-lg text-[11px] bg-gray-50 flex items-center justify-center gap-1 transition-colors active:bg-gray-100"
          >
            <span className={customerId ? "text-gray-700" : "text-gray-400"}>
              {customerId ? (data.customers.find((c) => c.id === customerId)?.name ?? "เลือกลูกค้า") : "เลือกลูกค้า"}
            </span>
            <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </header>

      {/* Search + Categories */}
      <div className="sticky top-[72px] z-10 bg-white border-b border-gray-100 px-3 py-2 space-y-2">
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

      {/* Cart bar — sits above the bottom tab bar (bottom-16) */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm text-gray-600">
            {currentOrder
              ? `${currentOrder.items.length} รายการ${newItemsCount > 0 ? ` · ใหม่ ${newItemsCount}` : ""}`
              : tableId ? "เลือกเมนูเพื่อเริ่มรับออเดอร์" : "เลือกโต๊ะก่อน"}
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
              เริ่มรับออเดอร์
            </button>
          )}
          {currentOrder && (
            <>
              <button
                type="button"
                onClick={handleKitchen}
                disabled={loading || newItemsCount === 0}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-40"
              >
                ส่งเข้าครัว{newItemsCount > 0 ? ` (${newItemsCount})` : ""}
              </button>
              <button
                type="button"
                onClick={() => currentOrder.tableId && onOpenBill(currentOrder.tableId, currentOrder.id)}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium shadow-sm transition-colors"
              >
                เรียกเก็บเงิน
              </button>
            </>
          )}
        </div>
      </div>

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

      {/* Table picker modal */}
      {showTablePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTablePicker(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">เลือกโต๊ะ</p>
              <button type="button" onClick={() => setShowTablePicker(false)} className="text-gray-400 text-lg leading-none">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { setTableId(null); setCurrentOrder(null); setShowTablePicker(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${!tableId ? "text-orange-500 font-semibold bg-orange-50" : "text-gray-400 hover:bg-gray-50"}`}
              >
                — ไม่เลือกโต๊ะ
              </button>
              {data.tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTableId(t.id); setCurrentOrder(null); setShowMoveTable(false); setShowTablePicker(false); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${tableId === t.id ? "text-orange-500 font-semibold bg-orange-50" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer picker modal */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCustomerPicker(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">เลือกลูกค้า</p>
              <button type="button" onClick={() => setShowCustomerPicker(false)} className="text-gray-400 text-lg leading-none">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { setCustomerId(null); if (currentOrder) updateOrderMeta({ customerId: null }); setShowCustomerPicker(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${!customerId ? "text-orange-500 font-semibold bg-orange-50" : "text-gray-400 hover:bg-gray-50"}`}
              >
                — ไม่เลือกลูกค้า
              </button>
              {data.customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setCustomerId(c.id); if (currentOrder) updateOrderMeta({ customerId: c.id }); setShowCustomerPicker(false); }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${customerId === c.id ? "text-orange-500 font-semibold bg-orange-50" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Move table modal */}
      {showMoveTable && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMoveTable(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-800 text-sm">ย้ายบิลไปโต๊ะ</p>
              <button type="button" onClick={() => setShowMoveTable(false)} className="text-gray-400 text-lg leading-none">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
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
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm shadow-lg font-medium tracking-wide">
          {toast}
        </div>
      )}
    </div>
  );
}
