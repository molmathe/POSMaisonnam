"use client";

import { useState, useEffect } from "react";
import { getMenuImageUrl } from "@/lib/get-menu-image-url";

type Menu = { id: number; nameTh: string; nameEn: string | null; price: number; imageUrl?: string | null };
type Topping = { id: number; name: string; price: number; group?: string | null };
type SpecialRequest = { id: number; name: string };
type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  note: string | null;
  toppings: { id: number; name: string; price: number }[] | null;
  requests: string[] | null;
};

export default function PosMenuModal({
  menu,
  toppings,
  specialRequests,
  editingItemId,
  currentItem,
  onAdd,
  onUpdate,
  onClose,
  loading,
}: {
  menu: Menu;
  toppings: Topping[];
  specialRequests: SpecialRequest[];
  editingItemId: number | null;
  currentItem: OrderItem | undefined;
  onAdd: (menuId: number, quantity: number, tops: { id: number; name: string; price: number }[], reqs: string[], note: string | null) => Promise<void>;
  onUpdate: (itemId: number, quantity: number, tops: { id: number; name: string; price: number }[], reqs: string[], note: string | null) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const allowedToppingIds = (menu as { allowedToppingIds?: number[] }).allowedToppingIds;
  const allowedRequestIds = (menu as { allowedRequestIds?: number[] }).allowedRequestIds;
  // Only show toppings/requests linked to this menu in admin (empty = show none)
  const displayToppings = Array.isArray(allowedToppingIds) ? toppings.filter((t) => allowedToppingIds.includes(t.id)) : [];
  const displayRequests = Array.isArray(allowedRequestIds) ? specialRequests.filter((r) => allowedRequestIds.includes(r.id)) : [];
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<{ id: number; name: string; price: number }[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const isEdit = Boolean(editingItemId && currentItem);

  useEffect(() => {
    if (currentItem) {
      setQuantity(currentItem.quantity);
      setSelectedToppings((currentItem.toppings as { id: number; name: string; price: number }[]) ?? []);
      setSelectedRequests((currentItem.requests as string[]) ?? []);
      setNote(currentItem.note ?? "");
    } else {
      setQuantity(1);
      setSelectedToppings([]);
      setSelectedRequests([]);
      setNote("");
    }
  }, [currentItem, menu.id]);

  const toggleTopping = (t: Topping) => {
    setSelectedToppings((prev) => {
      const has = prev.some((x) => x.id === t.id);
      if (has) return prev.filter((x) => x.id !== t.id);
      return [...prev, { id: t.id, name: t.name, price: t.price }];
    });
  };

  const toggleRequest = (name: string) => {
    setSelectedRequests((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]
    );
  };

  const toppingTotal = selectedToppings.reduce((s, t) => s + t.price, 0);
  const unitPrice = menu.price + toppingTotal;
  const total = unitPrice * quantity;

  const submit = () => {
    if (isEdit && editingItemId) {
      onUpdate(editingItemId, quantity, selectedToppings, selectedRequests, note.trim() || null);
    } else {
      onAdd(menu.id, quantity, selectedToppings, selectedRequests, note.trim() || null);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {menu.imageUrl && (
              <img
                src={getMenuImageUrl(menu.imageUrl)}
                alt=""
                className="h-16 w-16 rounded-lg object-cover border border-gray-200 mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <h3 className="font-semibold text-gray-900">{menu.nameTh}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 p-1 shrink-0">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-gray-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-lg hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {displayToppings.length > 0 && (() => {
            const withGroup = displayToppings.filter((t) => t.group);
            const noGroup = displayToppings.filter((t) => !t.group);
            const groupNames = [...new Set(withGroup.map((t) => t.group).filter(Boolean))] as string[];
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topping</label>
                <div className="space-y-3">
                  {noGroup.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {noGroup.map((t) => {
                        const selected = selectedToppings.some((x) => x.id === t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTopping(t)}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${selected ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-gray-200 text-gray-600 bg-white hover:border-orange-300 hover:bg-orange-50"}`}
                          >
                            {t.name} +฿{t.price.toFixed(0)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {groupNames.map((groupName) => {
                    const items = withGroup.filter((t) => t.group === groupName);
                    return (
                      <div key={groupName}>
                        <div className="text-xs font-medium text-gray-500 mb-1">{groupName}</div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((t) => {
                            const selected = selectedToppings.some((x) => x.id === t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => toggleTopping(t)}
                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${selected ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-gray-200 text-gray-600 bg-white hover:border-orange-300 hover:bg-orange-50"}`}
                              >
                                {t.name} +฿{t.price.toFixed(0)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {displayRequests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คำขอพิเศษ</label>
              <div className="flex flex-wrap gap-2">
                {displayRequests.map((r) => {
                  const selected = selectedRequests.includes(r.name);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRequest(r.name)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${selected ? "border-orange-500 bg-orange-500 text-white shadow-sm" : "border-gray-200 text-gray-600 bg-white hover:border-orange-300 hover:bg-orange-50"}`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="เช่น ไม่ผัก"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold text-gray-900">รวม ฿{total.toFixed(0)}</span>
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 transition-colors text-white font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? "..." : isEdit ? "บันทึก" : "เพิ่มลงตะกร้า"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
