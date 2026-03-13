"use client";

import { useState, useEffect, useCallback } from "react";
import { printReceipt, orderDisplayId, type ReceiptOrder } from "@/lib/pos-print";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  note: string | null;
  toppings: { name: string }[] | unknown;
  requests: string[] | unknown;
  menu: { nameTh: string };
};

type Receipt = {
  id: number;
  createdAt: string;
  totalPrice: number;
  discount: number;
  payMethod: "CASH" | "QR" | null;
  paidAt: string | null;
  table: { name: string } | null;
  customer: { name: string } | null;
  items: OrderItem[];
};

export default function PosReceiptsTab() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [summary, setSummary] = useState({ sumTotal: 0, sumDiscount: 0, sumCash: 0, sumQr: 0 });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/receipts?date=${d}`);
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.orders ?? []);
        setSummary(data.summary ?? { sumTotal: 0, sumDiscount: 0, sumCash: 0, sumQr: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [load, date]);

  const cancel = async (id: number) => {
    if (!confirm("ยกเลิกบิลนี้?")) return;
    const res = await fetch(`/api/pos/receipts/${id}`, { method: "DELETE" });
    if (res.ok) load(date);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      {/* Date + summary */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white flex-1"
        />
        <button
          type="button"
          onClick={() => load(date)}
          className="text-xs text-orange-500 font-medium px-3 py-2 rounded-xl border border-orange-200 bg-orange-50"
        >
          รีเฟรช
        </button>
      </div>

      {receipts.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: "รวมสุทธิ", value: summary.sumTotal, color: "text-green-700" },
            { label: "ส่วนลด", value: summary.sumDiscount, color: "text-gray-600" },
            { label: "เงินสด", value: summary.sumCash, color: "text-blue-600" },
            { label: "โอนชำระ", value: summary.sumQr, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-3 py-2">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`font-bold text-sm ${s.color}`}>฿{s.value.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-8">กำลังโหลด...</p>}

      {!loading && receipts.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-sm">ยังไม่มีบิลในวันนี้</p>
        </div>
      )}

      <div className="space-y-2">
        {receipts.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-gray-100 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">{r.table?.name ?? "-"}</span>
                {r.customer?.name && (
                  <span className="ml-2 text-sm text-gray-500">· {r.customer.name}</span>
                )}
              </div>
              <span className="font-bold text-green-600">฿{r.totalPrice.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-mono">#{orderDisplayId(r.createdAt)}</span>
                <span>{r.paidAt ? new Date(r.paidAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                <span>{r.payMethod === "CASH" ? "เงินสด" : r.payMethod === "QR" ? "โอนชำระ" : "-"}</span>
                {r.discount > 0 && <span>ลด ฿{r.discount.toFixed(0)}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className="text-xs text-orange-500 font-medium hover:underline"
                >
                  ดูบิล
                </button>
                <button
                  type="button"
                  onClick={() => cancel(r.id)}
                  className="text-xs text-red-400 font-medium hover:underline"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Receipt detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-semibold text-gray-900">บิล #{orderDisplayId(selected.createdAt)}</h2>
                <p className="text-xs text-gray-500">
                  {selected.table?.name ?? "-"}
                  {selected.customer?.name ? ` · ${selected.customer.name}` : ""}
                  {" · "}
                  {selected.paidAt ? new Date(selected.paidAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "-"}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>

            <div className="px-4 py-3">
              <ul className="divide-y divide-gray-50">
                {selected.items.map((item) => {
                  const tops = Array.isArray(item.toppings) ? (item.toppings as { name: string }[]) : [];
                  const reqs = Array.isArray(item.requests) ? (item.requests as string[]) : [];
                  return (
                    <li key={item.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900">{item.menu.nameTh}</span>
                          <span className="text-gray-400 ml-2 text-sm">x{item.quantity}</span>
                          {tops.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">Topping: {tops.map((t) => t.name).join(", ")}</p>
                          )}
                          {reqs.length > 0 && (
                            <p className="text-xs text-gray-500">คำขอ: {reqs.join(", ")}</p>
                          )}
                          {item.note && (
                            <p className="text-xs text-gray-400">หมายเหตุ: {item.note}</p>
                          )}
                        </div>
                        <span className="text-gray-700 text-sm shrink-0">฿{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-gray-100 pt-3 mt-1 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>ราคารวม</span>
                  <span>฿{selected.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(0)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>ส่วนลด</span>
                    <span>-฿{selected.discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>ยอดสุทธิ</span>
                  <span className="text-green-700">฿{selected.totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>วิธีชำระ</span>
                  <span>{selected.payMethod === "CASH" ? "เงินสด" : selected.payMethod === "QR" ? "โอนชำระ" : "-"}</span>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => printReceipt(selected as unknown as ReceiptOrder)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                พิมพ์ใบเสร็จ
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
