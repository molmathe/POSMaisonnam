"use client";

import { useState, DragEvent, ChangeEvent } from "react";

type Setting = {
  key: string;
  value: string;
  description: string;
  id: number | null;
};

interface Props {
  initialSettings: Setting[];
}

const SECTION_RECEIPT = ["RECEIPT_WIDTH", "RECEIPT_HEIGHT", "RECEIPT_HEADER", "RECEIPT_FOOTER", "RECEIPT_FONT"];
const SECTION_ORDER   = ["ORDER_PAPER_WIDTH", "ORDER_SHOW_CHECKBOX"];
const SECTION_PAYMENT = ["PAYMENT_QR_IMAGE"];
const SECTION_POS     = ["POS_PINCODE"];
const SECTION_FUTURE  = ["ENABLE_LINE_NOTI"];

const LABELS: Record<string, string> = {
  RECEIPT_WIDTH:    "ความกว้างกระดาษใบเสร็จ",
  RECEIPT_HEIGHT:   "ความยาวกระดาษใบเสร็จ (เว้นว่างได้)",
  RECEIPT_HEADER:   "ข้อความหัวใบเสร็จ",
  RECEIPT_FOOTER:   "ข้อความท้ายใบเสร็จ",
  RECEIPT_FONT:     "ฟอนต์บนใบเสร็จ",
  ORDER_PAPER_WIDTH:"ความกว้างกระดาษใบสั่งครัว",
  ORDER_SHOW_CHECKBOX: "แสดงช่องติ๊กหลังรายการอาหาร",
  PAYMENT_QR_IMAGE: "รูป QR สำหรับชำระเงิน",
  POS_PINCODE:      "PIN เข้าหน้า POS",
  ENABLE_LINE_NOTI: "แจ้งเตือนผ่าน LINE (ยังไม่เปิดใช้)",
};

const HINTS: Record<string, string> = {
  RECEIPT_WIDTH:    "เช่น 80mm หรือ 58mm",
  RECEIPT_HEIGHT:   "เช่น 200mm (ปล่อยว่างถ้าไม่จำกัด)",
  RECEIPT_HEADER:   "จะแสดงที่หัวบิล",
  RECEIPT_FOOTER:   "จะแสดงที่ท้ายบิล เช่น ขอบคุณที่ใช้บริการ",
  RECEIPT_FONT:     "เช่น TH Sarabun New, Kanit",
  ORDER_PAPER_WIDTH:"เช่น 80mm หรือ 58mm",
  ORDER_SHOW_CHECKBOX: "true = แสดงกล่องติ๊ก | false = ไม่แสดง",
  PAYMENT_QR_IMAGE: "อัปโหลดรูปภาพ QR Promptpay",
  POS_PINCODE:      "PIN สำหรับเปิดหน้า POS ทั่วไป (พนักงาน)",
  ENABLE_LINE_NOTI: "ฟีเจอร์นี้ยังไม่พร้อมใช้งาน",
};

export default function SettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Setting[]>(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [qrDragOver, setQrDragOver] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(
    initialSettings.find((s) => s.key === "PAYMENT_QR_IMAGE")?.value || null
  );
  const [qrFile, setQrFile] = useState<File | null>(null);

  function getValue(key: string) {
    return settings.find((s) => s.key === key)?.value ?? "";
  }

  function setValue(key: string, value: string) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  }

  async function saveSetting(key: string) {
    const s = settings.find((s) => s.key === key);
    if (!s) return;
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: s.key, value: s.value, description: s.description }),
      });
      if (!res.ok) throw new Error();
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      alert("ไม่สามารถบันทึกได้");
    } finally {
      setSaving(null);
    }
  }

  function handleQrFile(file: File) {
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  }

  async function saveQrFile() {
    if (!qrFile) return;
    const formData = new FormData();
    formData.append("file", qrFile);
    setSaving("PAYMENT_QR_IMAGE");
    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQrPreview(data.url);
      setValue("PAYMENT_QR_IMAGE", data.url);
      setQrFile(null);
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "PAYMENT_QR_IMAGE",
          value: data.url,
          description: "URL หรือ path รูปภาพ QR สำหรับชำระเงิน",
        }),
      });
      setSaved("PAYMENT_QR_IMAGE");
      setTimeout(() => setSaved(null), 2000);
      const input = document.getElementById("qr-upload") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch {
      alert("อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  }

  function renderField(key: string) {
    const isDisabled = key === "ENABLE_LINE_NOTI";
    const isSaving = saving === key;
    const isSaved = saved === key;

    if (key === "PAYMENT_QR_IMAGE") {
      return (
        <div className="space-y-2">
          <div
            onDragOver={(e: DragEvent) => { e.preventDefault(); setQrDragOver(true); }}
            onDragLeave={(e: DragEvent) => { e.preventDefault(); setQrDragOver(false); }}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setQrDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleQrFile(f);
            }}
            onClick={() => {
              const el = document.getElementById("qr-upload") as HTMLInputElement | null;
              el?.click();
            }}
            className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors ${
              qrDragOver ? "border-gray-800 bg-gray-50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              id="qr-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) handleQrFile(f);
              }}
            />
            {qrPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrPreview}
                  alt="QR ชำระเงิน"
                  className="h-40 w-auto object-contain rounded-lg border border-gray-200 bg-gray-50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="text-xs text-gray-500">
                  {qrFile ? "ตรวจสอบรูปแล้วกด \"บันทึก QR\" ด้านล่าง" : "กดหรือลากเพื่อเปลี่ยนรูป QR"}
                </p>
              </div>
            ) : (
              <div className="text-gray-500 text-sm py-4">
                <p>ลากรูป QR มาวาง หรือกดเพื่อเลือกไฟล์</p>
                <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG</p>
              </div>
            )}
          </div>
          {qrFile && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveQrFile}
                disabled={saving === "PAYMENT_QR_IMAGE"}
                className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving === "PAYMENT_QR_IMAGE" ? "กำลังบันทึก..." : "บันทึก QR"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrFile(null);
                  const prev = initialSettings.find((s) => s.key === "PAYMENT_QR_IMAGE")?.value || null;
                  setQrPreview(prev);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          )}
          {isSaved && !qrFile && (
            <p className="text-xs text-green-600">บันทึกแล้ว</p>
          )}
        </div>
      );
    }

    if (key === "ORDER_SHOW_CHECKBOX") {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newVal = getValue(key) === "true" ? "false" : "true";
              setValue(key, newVal);
              // auto-save
              setTimeout(() => saveSetting(key), 100);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              getValue(key) === "true" ? "bg-gray-900" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                getValue(key) === "true" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {getValue(key) === "true" ? "แสดงช่องติ๊ก" : "ไม่แสดงช่องติ๊ก"}
          </span>
          {isSaved && <span className="text-xs text-green-600">บันทึกแล้ว</span>}
        </div>
      );
    }

    if (key === "ENABLE_LINE_NOTI") {
      return (
        <div className="flex items-center gap-2">
          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 cursor-not-allowed opacity-50">
            <span className="inline-block h-4 w-4 rounded-full bg-white shadow translate-x-1" />
          </div>
          <span className="text-sm text-gray-400">ปิดไว้ก่อน (เตรียมพร้อมในอนาคต)</span>
        </div>
      );
    }

    const isMultiline = ["RECEIPT_HEADER", "RECEIPT_FOOTER"].includes(key);

    return (
      <div className="flex gap-2">
        {isMultiline ? (
          <textarea
            rows={2}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 resize-none"
            value={getValue(key)}
            onChange={(e) => setValue(key, e.target.value)}
            disabled={isDisabled}
          />
        ) : (
          <input
            type={key === "POS_PINCODE" ? "text" : "text"}
            maxLength={key === "POS_PINCODE" ? 8 : undefined}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
            value={getValue(key)}
            onChange={(e) => setValue(key, e.target.value)}
            disabled={isDisabled}
          />
        )}
        <button
          onClick={() => saveSetting(key)}
          disabled={isSaving || isDisabled}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            isSaved
              ? "bg-green-500 text-white shadow-sm"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors disabled:opacity-50"
          }`}
        >
          {isSaving ? "..." : isSaved ? "บันทึกแล้ว" : "บันทึก"}
        </button>
      </div>
    );
  }

  function renderSection(title: string, keys: string[]) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="space-y-4">
          {keys.map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs md:text-sm font-medium text-gray-700">
                  {LABELS[key]}
                </label>
              </div>
              {HINTS[key] && (
                <p className="text-[11px] text-gray-400 mb-1.5">{HINTS[key]}</p>
              )}
              {renderField(key)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSection("ใบเสร็จรับเงิน (Bill)", SECTION_RECEIPT)}
      {renderSection("ใบสั่งเข้าครัว", SECTION_ORDER)}
      {renderSection("QR ชำระเงิน", SECTION_PAYMENT)}
      {renderSection("PIN เข้าหน้า POS", SECTION_POS)}
      {renderSection("ฟีเจอร์อนาคต (ปิดใช้งาน)", SECTION_FUTURE)}
    </div>
  );
}
