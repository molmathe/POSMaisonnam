"use client";

import { useState, useEffect, DragEvent, ChangeEvent } from "react";
import { getMenuImageUrl } from "@/lib/get-menu-image-url";

type Category = { id: number; name: string };
type Topping = { id: number; name: string; price: number; group?: string | null };
type SpecialRequest = { id: number; name: string };
type Menu = {
  id: number;
  nameTh: string;
  nameEn: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: number;
  category?: Category;
  allowedToppingIds?: number[];
  allowedRequestIds?: number[];
};

interface Props {
  menu: Menu;
  categories: Category[];
  toppings: Topping[];
  specialRequests: SpecialRequest[];
  onClose: () => void;
  onSaved: (updated: Menu) => void;
}

export default function MenuEditModal({
  menu,
  categories,
  toppings,
  specialRequests,
  onClose,
  onSaved,
}: Props) {
  const [nameTh, setNameTh] = useState(menu.nameTh);
  const [nameEn, setNameEn] = useState(menu.nameEn ?? "");
  const [price, setPrice] = useState(String(menu.price));
  const [categoryId, setCategoryId] = useState(menu.categoryId);
  const [imageUrl, setImageUrl] = useState<string | null>(menu.imageUrl);
  const [toppingIds, setToppingIds] = useState<number[]>(menu.allowedToppingIds ?? []);
  const [requestIds, setRequestIds] = useState<number[]>(menu.allowedRequestIds ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNameTh(menu.nameTh);
    setNameEn(menu.nameEn ?? "");
    setPrice(String(menu.price));
    setCategoryId(menu.categoryId);
    setImageUrl(menu.imageUrl);
    setToppingIds(menu.allowedToppingIds ?? []);
    setRequestIds(menu.allowedRequestIds ?? []);
  }, [menu]);

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!file) return imageUrl;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
    if (!res.ok) throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
    const data = await res.json();
    return data.url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericPrice = Number(price);
    if (!nameTh.trim()) {
      setError("กรุณากรอกชื่อเมนู");
      return;
    }
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setError("กรุณากรอกราคาให้ถูกต้อง");
      return;
    }
    if (!categoryId) {
      setError("กรุณาเลือกหมวดหมู่");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const uploadedUrl = await uploadImageIfNeeded();

      const res = await fetch(`/api/admin/menus/${menu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameTh: nameTh.trim(),
          nameEn: nameEn.trim() || null,
          price: numericPrice,
          categoryId,
          imageUrl: uploadedUrl ?? null,
          toppingIds,
          requestIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถบันทึกได้");
      }
      const updated = await res.json();
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setImageUrl(URL.createObjectURL(f));
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">แก้ไขเมนู</h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู (ไทย)</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              placeholder="ชื่อเมนู (ไทย)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู (อังกฤษ) <span className="text-gray-400">ไม่บังคับ</span></label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="ชื่อเมนู (อังกฤษ)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
              <input
                type="number"
                min={0}
                step={1}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพเมนู</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg px-3 py-3 text-xs text-gray-500 cursor-pointer ${
                dragOver ? "border-gray-800 bg-gray-50" : "border-gray-300"
              }`}
              onClick={() => (document.getElementById("edit-menu-image") as HTMLInputElement)?.click()}
            >
              <input
                id="edit-menu-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setImageUrl(URL.createObjectURL(f));
                  }
                  e.target.value = "";
                }}
              />
              ลากรูปมาวางหรือคลิกเพื่อเลือก
            </div>
            {imageUrl && (
              <img
                src={imageUrl.startsWith("blob:") ? imageUrl : getMenuImageUrl(imageUrl)}
                alt=""
                className="mt-2 h-20 w-auto max-w-full rounded-lg border border-gray-200 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          {toppings.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topping ที่ใช้กับเมนูนี้</label>
              <div className="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden text-sm">
                <div className="bg-gray-50 p-2 border-r border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">พร้อมใช้งาน</p>
                  <div className="space-y-1">
                    {toppings.filter((t) => !toppingIds.includes(t.id)).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setToppingIds((prev) => [...prev, t.id])}
                        className="w-full text-left px-2 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 flex items-center justify-between gap-1"
                      >
                        <span className="truncate">{t.name} +฿{t.price.toFixed(0)}</span>
                        <span className="text-orange-500 shrink-0 font-bold">+</span>
                      </button>
                    ))}
                    {toppings.filter((t) => !toppingIds.includes(t.id)).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">ทั้งหมดถูกเลือกแล้ว</p>
                    )}
                  </div>
                </div>
                <div className="bg-orange-50 p-2">
                  <p className="text-xs font-medium text-orange-600 mb-1.5">ใช้อยู่</p>
                  <div className="space-y-1">
                    {toppings.filter((t) => toppingIds.includes(t.id)).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setToppingIds((prev) => prev.filter((id) => id !== t.id))}
                        className="w-full text-left px-2 py-1.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700 flex items-center justify-between gap-1"
                      >
                        <span className="truncate">{t.name} +฿{t.price.toFixed(0)}</span>
                        <span className="shrink-0">✕</span>
                      </button>
                    ))}
                    {toppingIds.length === 0 && (
                      <p className="text-xs text-orange-300 text-center py-2">ยังไม่มี</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {specialRequests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำขอพิเศษที่ใช้กับเมนูนี้</label>
              <div className="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden text-sm">
                <div className="bg-gray-50 p-2 border-r border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">พร้อมใช้งาน</p>
                  <div className="space-y-1">
                    {specialRequests.filter((r) => !requestIds.includes(r.id)).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRequestIds((prev) => [...prev, r.id])}
                        className="w-full text-left px-2 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50 flex items-center justify-between gap-1"
                      >
                        <span className="truncate">{r.name}</span>
                        <span className="text-orange-500 shrink-0 font-bold">+</span>
                      </button>
                    ))}
                    {specialRequests.filter((r) => !requestIds.includes(r.id)).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">ทั้งหมดถูกเลือกแล้ว</p>
                    )}
                  </div>
                </div>
                <div className="bg-orange-50 p-2">
                  <p className="text-xs font-medium text-orange-600 mb-1.5">ใช้อยู่</p>
                  <div className="space-y-1">
                    {specialRequests.filter((r) => requestIds.includes(r.id)).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRequestIds((prev) => prev.filter((id) => id !== r.id))}
                        className="w-full text-left px-2 py-1.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700 flex items-center justify-between gap-1"
                      >
                        <span className="truncate">{r.name}</span>
                        <span className="shrink-0">✕</span>
                      </button>
                    ))}
                    {requestIds.length === 0 && (
                      <p className="text-xs text-orange-300 text-center py-2">ยังไม่มี</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-60"
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
