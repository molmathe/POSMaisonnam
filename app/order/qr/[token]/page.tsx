import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderQrCountdown from "./_OrderQrCountdown";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date) {
  const x = new Date(d);
  const day = x.getDate().toString().padStart(2, "0");
  const month = (x.getMonth() + 1).toString().padStart(2, "0");
  const year = x.getFullYear() + 543;
  const h = x.getHours().toString().padStart(2, "0");
  const m = x.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${h}:${m}`;
}

async function getOrderByToken(token: string) {
  const order = await prisma.order.findUnique({
    where: { qrToken: token },
    include: { table: true, customer: true, items: { include: { menu: true } } },
  });
  if (!order || (order.qrExpires && new Date() > order.qrExpires)) return null;
  const items = order.items.map((i) => ({
    name: i.menu.nameTh,
    quantity: i.quantity,
    price: i.price,
    total: i.price * i.quantity,
    note: i.note,
    toppings: i.toppings as { name: string }[] | null,
    requests: i.requests as string[] | null,
  }));
  const subtotalFromItems = items.reduce((s, i) => s + i.total, 0);
  const totalPrice = order.status === "PAID" ? order.totalPrice : subtotalFromItems;
  const discount = order.discount ?? 0;
  return {
    tableName: order.table?.name ?? "-",
    customerName: order.customer?.name ?? null,
    items,
    totalPrice,
    discount,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    payMethod: order.payMethod,
    cashReceived: order.cashReceived,
    changeAmount: order.changeAmount,
    qrExpires: order.qrExpires?.toISOString() ?? null,
    createdAtFormatted: formatDateTime(order.createdAt),
    paidAtFormatted: order.paidAt ? formatDateTime(order.paidAt) : null,
  };
}

export default async function OrderQrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getOrderByToken(token);
  if (!data) notFound();

  const isPaid = data.status === "PAID";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans" lang="th">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="text-center p-6 border-b border-gray-100 bg-orange-50">
          <h1 className="text-2xl font-bold text-gray-900">ไม้ซ่อนน้ำ</h1>
          <p className="text-sm text-gray-600 mt-1">รายการสั่งอาหาร (ตรวจสอบก่อนชำระเงิน)</p>
          <div className={`mt-3 text-sm font-semibold px-3 py-1.5 rounded-full inline-block ${
            isPaid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}>
            {isPaid ? "ชำระเงินเรียบร้อยแล้ว" : "รอชำระ"}
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">โต๊ะ</span>
              <span className="font-medium text-gray-900">{data.tableName}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ลูกค้า</span>
                <span className="font-medium text-gray-900">{data.customerName}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-800 mb-3">รายการอาหาร</p>
            <ul className="space-y-3">
              {data.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 pr-4">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-orange-600 ml-2 font-medium">x{item.quantity}</span>
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">Topping: {item.toppings.map((t) => t.name).join(", ")}</p>
                    )}
                    {item.requests && item.requests.length > 0 && (
                      <p className="text-xs text-gray-500">คำขอ: {item.requests.join(", ")}</p>
                    )}
                    {item.note && (
                      <p className="text-xs text-gray-500">หมายเหตุ: {item.note}</p>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium">฿{item.total.toFixed(0)}</span>
                </li>
              ))}
            </ul>
            {data.discount > 0 && (
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>ส่วนลด</span>
                <span>-฿{data.discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200 text-green-600">
              <span>รวมทั้งสิ้น</span>
              <span>฿{data.totalPrice.toFixed(0)}</span>
            </div>
          </div>

          {isPaid && data.payMethod && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
              <p className="font-medium text-gray-700 mb-1">วิธีชำระเงิน</p>
              {data.payMethod === "CASH" ? (
                <div className="space-y-0.5 text-gray-600">
                  <p>ชำระเป็นเงินสด</p>
                  {data.cashReceived != null && data.cashReceived > 0 && (
                    <>
                      <p>รับมา ฿{data.cashReceived.toFixed(0)}</p>
                      {data.changeAmount != null && (
                        <p>ทอน ฿{data.changeAmount.toFixed(0)}</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">โอนชำระ</p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 text-center space-y-0.5">
            <span className="block">วันและเวลาเริ่ม {data.createdAtFormatted}</span>
            {data.paidAtFormatted && (
              <span className="block">วันและเวลาปิดบิล {data.paidAtFormatted}</span>
            )}
          </p>
          <OrderQrCountdown expiresAt={data.qrExpires} />
        </div>
      </div>
    </div>
  );
}
