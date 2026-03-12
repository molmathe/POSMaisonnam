"use client";

import { useState, useEffect, useCallback, type ComponentProps } from "react";
import PosMenuModal from "./_PosMenuModal";

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
  table: { id: number; name: string } | null;
  customer: { id: number; name: string } | null;
  items: OrderItem[];
  status: string;
};

type PosData = {
  menus: { id: number; nameTh: string; nameEn: string | null; price: number; categoryId: number }[];
  toppings: { id: number; name: string; price: number }[];
  specialRequests: { id: number; name: string }[];
};

export default function PosBill({
  orderId,
  paymentQrUrl,
  onClose,
  onLogout,
}: {
  orderId: number;
  paymentQrUrl: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [data, setData] = useState<PosData | null>(null);
  const [step, setStep] = useState<"bill" | "pay">("bill");
  const [payMethod, setPayMethod] = useState<"cash" | "qr" | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [menuModal, setMenuModal] = useState<{ id: number; nameTh: string; nameEn: string | null; price: number } | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showMoveTable, setShowMoveTable] = useState(false);
  const [tables, setTables] = useState<{ id: number; name: string }[]>([]);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/pos/orders/${orderId}`);
    if (res.ok) setOrder(await res.json());
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    fetch("/api/pos/data")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setData({ menus: d.menus, toppings: d.toppings, specialRequests: d.specialRequests });
          setTables(d.tables ?? []);
        }
      });
  }, [fetchOrder]);

  const createQr = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/qr`, { method: "POST" });
      if (res.ok) {
        const j = await res.json();
        setQrUrl(j.url ?? j.fullUrl ?? null);
      }
    } finally {
      setQrLoading(false);
    }
  };

  const moveTable = async (newTableId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: newTableId }),
      });
      if (res.ok) {
        await fetchOrder();
        setShowMoveTable(false);
        setToast("ย้ายโต๊ะแล้ว");
        setTimeout(() => setToast(""), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (
    itemId: number,
    quantity: number,
    toppings: { id: number; name: string; price: number }[],
    requests: string[],
    note: string | null
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, toppings, requests, note }),
      });
      if (res.ok) {
        await fetchOrder();
        setMenuModal(null);
        setEditingItemId(null);
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

  const doPay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discount: Math.max(0, Number(discountInput) || 0),
          payMethod: payMethod === "cash" ? "CASH" : payMethod === "qr" ? "QR" : null,
        }),
      });
      if (res.ok) {
        setToast("ชำระเงินเรียบร้อย");
        setTimeout(() => onClose(), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState("");
  const subtotal = order?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const discountNum = Math.max(0, Number(discountInput) || 0);
  const total = Math.max(0, subtotal - discountNum);
  const cashNum = Number(cashReceived) || 0;
  const change = cashNum - total;

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 transition-colors font-medium">
            ← กลับ
          </button>
          <span className="font-semibold text-gray-900">
            บิล {order.table?.name ?? "ไม่มีโต๊ะ"}
            {order.customer?.name && ` · ${order.customer.name}`}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoveTable((s) => !s)}
              className="text-xs px-2 py-1 rounded border border-gray-200 text-orange-600 hover:bg-orange-50 transition-colors font-medium bg-white"
            >
              ย้ายโต๊ะ
            </button>
            {showMoveTable && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 min-w-[120px]">
                {tables.filter((t) => t.id !== order.tableId).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => moveTable(t.id)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 rounded hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={onLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
          ออก
        </button>
      </header>

      {step === "bill" && (
        <>
          <div className="flex-1 px-3 py-4">
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{item.menu.nameTh}</span>
                    <span className="text-gray-500 ml-1">x{item.quantity}</span>
                    {item.note && (
                      <p className="text-xs text-gray-400 truncate">{item.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">฿{(item.price * item.quantity).toFixed(0)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const menu = data?.menus.find((m) => m.id === item.menuId);
                        if (menu) {
                          setEditingItemId(item.id);
                          setMenuModal(menu);
                        }
                      }}
                      className="text-xs font-medium text-orange-500 hover:text-orange-600 px-2 py-1 rounded bg-orange-50 transition-colors"
                    >
                      แก้
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-50 transition-colors"
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ยอดรวม</span>
                <span className="font-medium">฿{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-600">ส่วนลด (บาท)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>ยอดสุทธิ</span>
                <span>฿{total.toFixed(0)}</span>
              </div>
            </div>

            {/* QR ให้ลูกค้าสแกนดูรายการ 24 ชม. */}
            <div className="mt-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">QR ให้ลูกค้าตรวจสอบรายการ (24 ชม.)</p>
              {qrUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + qrUrl : qrUrl)}`}
                    alt="QR ตรวจสอบรายการ"
                    className="rounded-lg border border-gray-200"
                  />
                  <p className="text-xs text-gray-500">ลูกค้าสแกนเพื่อดูรายการก่อนชำระ</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={createQr}
                  disabled={qrLoading}
                  className="w-full py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50"
                >
                  {qrLoading ? "กำลังสร้าง..." : "สร้าง QR"}
                </button>
              )}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setStep("pay")}
              className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 transition-colors text-white font-medium shadow-sm"
            >
              ชำระเงิน
            </button>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  await fetch(`/api/pos/orders/${orderId}/kitchen`, { method: "POST" });
                  setToast("ส่งเข้าครัวแล้ว");
                  setTimeout(() => setToast(""), 2000);
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-2 w-full py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-colors"
            >
              ส่งเข้าครัว (เฉพาะรายการใหม่)
            </button>
          </div>
        </>
      )}

      {step === "pay" && !payMethod && (
        <div className="flex-1 px-3 py-4">
          <p className="text-sm text-gray-600 mb-4">เลือกวิธีชำระเงิน</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayMethod("cash")}
              className="py-4 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 transition-all shadow-sm"
            >
              เงินสด
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("qr")}
              className="py-4 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 transition-all shadow-sm"
            >
              สแกน QR
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep("bill")}
            className="mt-4 w-full py-2 text-gray-500 text-sm"
          >
            ← กลับไปบิล
          </button>
        </div>
      )}

      {step === "pay" && payMethod === "cash" && (
        <div className="flex-1 px-3 py-4">
          <p className="text-sm text-gray-600 mb-2">ยอดที่ต้องชำระ ฿{total.toFixed(0)}</p>
          <input
            type="number"
            min={0}
            step="1"
            placeholder="จำนวนเงินที่รับ (บาท)"
            className="w-full rounded-xl border border-gray-300 py-3 px-4 text-lg"
            value={cashReceived}
            onChange={(e) => setCashReceived(e.target.value)}
          />
          {cashNum > 0 && (
            <p className={`mt-2 text-lg font-semibold ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? `ทอน ฿${change.toFixed(0)}` : "จำนวนเงินไม่พอ"}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setPayMethod(null)}
              className="flex-1 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors font-medium"
            >
              กลับ
            </button>
            <button
              type="button"
              onClick={doPay}
              disabled={loading || change < 0}
              className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 transition-colors text-white font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? "..." : "ยืนยันชำระเงิน"}
            </button>
          </div>
        </div>
      )}

      {step === "pay" && payMethod === "qr" && (
        <div className="flex-1 px-3 py-4 flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-4">ยอดที่ต้องชำระ ฿{subtotal.toFixed(0)}</p>
          {paymentQrUrl ? (
            <img
              src={paymentQrUrl}
              alt="QR ชำระเงิน"
              className="max-w-[240px] w-full rounded-xl border border-gray-200"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
              ยังไม่มีรูป QR
              <br />
              (ตั้งค่าในหลังบ้าน)
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500 text-center">
            ให้ลูกค้าสแกน QR เพื่อชำระเงิน จากนั้นกดยืนยันด้านล่าง
          </p>
          <div className="mt-6 flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setPayMethod(null)}
              className="flex-1 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors font-medium"
            >
              กลับ
            </button>
            <button
              type="button"
              onClick={doPay}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 transition-colors text-white font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? "..." : "ยืนยันชำระแล้ว"}
            </button>
          </div>
        </div>
      )}

      {menuModal && data && editingItemId && order && (
        <PosMenuModal
          menu={menuModal}
          toppings={data.toppings}
          specialRequests={data.specialRequests}
          editingItemId={editingItemId}
          currentItem={order.items.find((i) => i.id === editingItemId) as ComponentProps<typeof PosMenuModal>["currentItem"]}
          onAdd={async () => {}}
          onUpdate={updateItem}
          onClose={() => {
            setMenuModal(null);
            setEditingItemId(null);
          }}
          loading={loading}
        />
      )}

      {toast && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-20">
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-medium">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
