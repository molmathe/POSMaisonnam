"use client";

import { useEffect, useState } from "react";

type Receipt = {
  id: number;
  totalPrice: number;
  discount: number;
  payMethod: "CASH" | "QR" | null;
  paidAt: string | null;
  table: { name: string } | null;
  customer: { name: string } | null;
};

type ReceiptResponse = {
  orders: Receipt[];
  summary: {
    sumTotal: number;
    sumDiscount: number;
    sumCash: number;
    sumQr: number;
  };
};

type ReceiptDetail = Receipt & {
  items: {
    id: number;
    quantity: number;
    price: number;
    note: string | null;
    menu: { nameTh: string };
  }[];
};

export default function PosReceiptsPage() {
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [data, setData] = useState<ReceiptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ReceiptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/receipts?date=${date}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeDate = (v: string) => {
    setDate(v);
    setTimeout(load, 0);
  };

  const cancelReceipt = async (id: number) => {
    if (!confirm("ยกเลิกบิลนี้?")) return;
    const res = await fetch(`/api/pos/receipts/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const openReceipt = async (r: Receipt) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/pos/receipts/${r.id}`);
      if (res.ok) {
        const full = await res.json();
        setSelected(full);
      } else {
        setSelected(r as any);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-semibold text-gray-900 text-lg">ประวัติบิล</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => onChangeDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        />
      </header>

      {loading && (
        <p className="text-sm text-gray-500 mb-2">กำลังโหลด...</p>
      )}

      {data && (
        <>
          <div className="mb-3 text-sm text-gray-700">
            <span className="mr-4">รวมสุทธิ: ฿{data.summary.sumTotal.toFixed(0)}</span>
            <span className="mr-4">ส่วนลดรวม: ฿{data.summary.sumDiscount.toFixed(0)}</span>
            <span className="mr-4">เงินสด: ฿{data.summary.sumCash.toFixed(0)}</span>
            <span>สแกนจ่าย: ฿{data.summary.sumQr.toFixed(0)}</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">เวลา</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">โต๊ะ</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">ลูกค้า</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">ยอด</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">จ่าย</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      {r.paidAt ? new Date(r.paidAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="px-3 py-2">{r.table?.name ?? "-"}</td>
                    <td className="px-3 py-2">{r.customer?.name ?? "-"}</td>
                    <td className="px-3 py-2 text-right">
                      ฿{r.totalPrice.toFixed(0)}
                      {r.discount > 0 && (
                        <span className="block text-xs text-gray-400">
                          (ลด ฿{r.discount.toFixed(0)})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.payMethod === "CASH" ? "เงินสด" : r.payMethod === "QR" ? "สแกน" : "-"}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openReceipt(r)}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        เปิดดู
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelReceipt(r.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        ยกเลิก
                      </button>
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400 text-sm">
                      ยังไม่มีบิลในวันนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">บิล #{selected.id}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-3 text-sm text-gray-700 space-y-1">
              <p>โต๊ะ: {selected.table?.name ?? "-"}</p>
              <p>ลูกค้า: {selected.customer?.name ?? "-"}</p>
              <p>
                เวลา:{" "}
                {selected.paidAt
                  ? new Date(selected.paidAt).toLocaleString("th-TH")
                  : "-"}
              </p>
              <p>ยอดสุทธิ: ฿{selected.totalPrice.toFixed(0)}</p>
              {selected.discount > 0 && (
                <p className="text-gray-500">
                  ส่วนลด: ฿{selected.discount.toFixed(0)}
                </p>
              )}
              <p>
                วิธีจ่าย:{" "}
                {selected.payMethod === "CASH"
                  ? "เงินสด"
                  : selected.payMethod === "QR"
                  ? "สแกน"
                  : "-"}
              </p>
            </div>

            {detailLoading && (
              <div className="px-4 pb-3 text-xs text-gray-400">กำลังโหลดรายการอาหาร...</div>
            )}

            {selected.items && selected.items.length > 0 && (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">รายการอาหาร</p>
                <ul className="divide-y divide-gray-100">
                  {selected.items.map((it) => (
                    <li key={it.id} className="py-1.5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800">
                          {it.menu.nameTh} x{it.quantity}
                        </span>
                        {it.note && (
                          <p className="text-[11px] text-gray-500 truncate">{it.note}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">
                        ฿{(it.price * it.quantity).toFixed(0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

