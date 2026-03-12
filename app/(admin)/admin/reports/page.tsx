"use client";

import { useEffect, useState } from "react";

type DailyOrder = {
  id: number;
  totalPrice: number;
  discount: number;
  payMethod: "CASH" | "QR" | null;
  paidAt: string | null;
  table: { name: string } | null;
  customer: { name: string } | null;
};

type DailyResponse = {
  orders: DailyOrder[];
  summary: {
    sumTotal: number;
    sumDiscount: number;
    sumCash: number;
    sumQr: number;
  };
};

export default function AdminReportsPage() {
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/reports/daily?date=${date}`);
      if (res.ok) setData(await res.json());
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

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">สรุปยอดรายวัน</h1>
          <p className="text-xs text-gray-500">สรุปตามบิลที่ชำระแล้ว</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => onChangeDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        />
      </div>

      {loading && <p className="text-sm text-gray-500">กำลังโหลด...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 mb-1">ยอดสุทธิรวม</p>
              <p className="text-lg font-semibold text-gray-900">
                ฿{data.summary.sumTotal.toFixed(0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 mb-1">ส่วนลดรวม</p>
              <p className="text-lg font-semibold text-orange-600">
                ฿{data.summary.sumDiscount.toFixed(0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 mb-1">เงินสด</p>
              <p className="text-lg font-semibold text-green-600">
                ฿{data.summary.sumCash.toFixed(0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 mb-1">สแกนจ่าย</p>
              <p className="text-lg font-semibold text-blue-600">
                ฿{data.summary.sumQr.toFixed(0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">เวลา</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">โต๊ะ</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">ลูกค้า</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">ยอดสุทธิ</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">ส่วนลด</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">วิธีจ่าย</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      {o.paidAt
                        ? new Date(o.paidAt).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-3 py-2">{o.table?.name ?? "-"}</td>
                    <td className="px-3 py-2">{o.customer?.name ?? "-"}</td>
                    <td className="px-3 py-2 text-right">
                      ฿{o.totalPrice.toFixed(0)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {o.discount > 0 ? `฿${o.discount.toFixed(0)}` : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {o.payMethod === "CASH"
                        ? "เงินสด"
                        : o.payMethod === "QR"
                        ? "สแกน"
                        : "-"}
                    </td>
                  </tr>
                ))}
                {data.orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-gray-400 text-sm"
                    >
                      ยังไม่มีบิลในวันนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

