import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getOrderByToken(token: string) {
  const order = await prisma.order.findUnique({
    where: { qrToken: token },
    include: { table: true, customer: true, items: { include: { menu: true } } },
  });
  if (!order || (order.qrExpires && new Date() > order.qrExpires)) return null;
  if (order.status !== "PENDING") return null;
  const items = order.items.map((i) => ({
    name: i.menu.nameTh,
    quantity: i.quantity,
    price: i.price,
    total: i.price * i.quantity,
    note: i.note,
  }));
  const totalPrice = items.reduce((s, i) => s + i.total, 0);
  return {
    tableName: order.table?.name ?? "-",
    customerName: order.customer?.name ?? null,
    items,
    totalPrice,
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans" lang="th">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="text-center p-6 border-b border-gray-100 bg-orange-50">
          <h1 className="text-2xl font-bold text-gray-900">ไม้ซ่อนน้ำ</h1>
          <p className="text-sm text-gray-600 mt-1">รายการสั่งอาหาร (ตรวจสอบก่อนชำระเงิน)</p>
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
                    {item.note ? (
                      <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                    ) : null}
                  </div>
                  <span className="text-gray-900 font-medium">฿{item.total.toFixed(0)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-gray-200 text-green-600">
              <span>รวมทั้งสิ้น</span>
              <span>฿{data.totalPrice.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 text-center mt-6">
        รหัสนี้ใช้ตรวจสอบรายการได้ 24 ชั่วโมง
      </p>
    </div>
  );
}
