import { prisma } from "@/lib/prisma";
import SettingsClient from "./_SettingsClient";

export const dynamic = "force-dynamic";

const DEFAULT_KEYS = [
  { key: "RECEIPT_WIDTH",    description: "ความกว้างกระดาษใบเสร็จ",         value: "80mm" },
  { key: "RECEIPT_HEIGHT",   description: "ความยาวกระดาษใบเสร็จ (ว่างได้)", value: "" },
  { key: "RECEIPT_HEADER",   description: "ข้อความหัวใบเสร็จ",              value: "ไม้ซ่อนน้ำ - ใบเสร็จรับเงิน" },
  { key: "RECEIPT_FOOTER",   description: "ข้อความท้ายใบเสร็จ",             value: "ขอบคุณที่ใช้บริการ" },
  { key: "RECEIPT_FONT",     description: "ฟอนต์ใบเสร็จ",                   value: "TH Sarabun New" },
  { key: "ORDER_PAPER_WIDTH",description: "ความกว้างกระดาษใบสั่งครัว",       value: "80mm" },
  { key: "ORDER_SHOW_CHECKBOX", description: "แสดงช่องติ๊กหลังรายการอาหาร (true/false)", value: "true" },
  { key: "PAYMENT_QR_IMAGE", description: "URL หรือ path รูปภาพ QR สำหรับชำระเงิน", value: "" },
  { key: "POS_PINCODE",      description: "PIN เข้าหน้า POS (พนักงานทั่วไปใช้)",    value: "1234" },
  { key: "ENABLE_LINE_NOTI", description: "เปิด/ปิดการแจ้งเตือนผ่าน LINE (ยังไม่ใช้งาน)", value: "false" },
];

export default async function SettingsPage() {
  const existing = await prisma.systemSetting.findMany();
  const existingMap = Object.fromEntries(existing.map((s) => [s.key, s]));

  // merge: ใช้ค่าที่มีใน DB หรือ default
  const settings = DEFAULT_KEYS.map((d) => ({
    ...d,
    value: existingMap[d.key]?.value ?? d.value,
    id: existingMap[d.key]?.id ?? null,
  }));

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          ตั้งค่าบิลและการชำระเงิน
        </h2>
        <p className="text-gray-500 text-sm md:text-base mt-1">
          ปรับแต่งรูปแบบใบเสร็จ ใบสั่งครัว อัปโหลด QR ชำระเงิน และ PIN เข้า POS
        </p>
      </header>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
