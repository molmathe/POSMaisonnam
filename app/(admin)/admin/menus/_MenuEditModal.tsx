"use client";

import { useState, useEffect, DragEvent, ChangeEvent } from "react";

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

  const DRAG_TYPE_TOPPING = "application/x-menu-topping";
  const DRAG_TYPE_REQUEST = "application/x-menu-request";

  function handleToppingDragStart(e: DragEvent<HTMLDivElement>, id: number) {
    e.dataTransfer.setData(DRAG_TYPE_TOPPING, String(id));
    e.dataTransfer.effectAllowed = "copy";
  }
  function handleRequestDragStart(e: DragEvent<HTMLDivElement>, id: number) {
    e.dataTransfer.setData(DRAG_TYPE_REQUEST, String(id));
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleToppingDropZoneDragOver(e: DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes(DRAG_TYPE_TOPPING)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }
  function handleToppingDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE_TOPPING);
    if (id && !toppingIds.includes(Number(id))) setToppingIds((prev) => [...prev, Number(id)]);
  }
  function handleRequestDropZoneDragOver(e: DragEvent<HTMLDivElement>) {
    if (e.dataTransfer.types.includes(DRAG_TYPE_REQUEST)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }
  function handleRequestDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE_REQUEST);
    if (id && !requestIds.includes(Number(id))) setRequestIds((prev) => [...prev, Number(id)]);
  }

  const withGroup = toppings.filter((t) => t.group);
  const noGroup = toppings.filter((t) => !t.group);
  const groupNames = [...new Set(withGroup.map((t) => t.group).filter(Boolean))] as string[];

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
                accept="image/*"
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
                src={imageUrl}
                alt=""
                className="mt-2 h-20 w-auto max-w-full rounded-lg border border-gray-200 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          {toppings.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topping ที่ใช้กับเมนูนี้</label>
              <p className="text-xs text-gray-500 mb-2">ลากการ์ดมาวางด้านล่าง หรือคลิกที่แท็กเพื่อลบ</p>
              <div
                onDragOver={handleToppingDropZoneDragOver}
                onDrop={handleToppingDrop}
                onDragLeave={(e) => e.preventDefault()}
                className="min-h-[52px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-2 flex flex-wrap gap-2"
              >
                {toppingIds.length === 0 ? (
                  <span className="text-xs text-gray-400 self-center">วาง Topping ที่นี่</span>
                ) : (
                  toppings
                    .filter((t) => toppingIds.includes(t.id))
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setToppingIds((prev) => prev.filter((id) => id !== t.id))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-sm font-medium hover:bg-orange-200 border border-orange-200"
                      >
                        {t.name} +฿{t.price.toFixed(0)} ✕
                      </button>
                    ))
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {noGroup.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleToppingDragStart(e, t.id)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-grab active:cursor-grabbing shadow-sm hover:border-orange-300 hover:shadow"
                  >
                    {t.name} +฿{t.price.toFixed(0)}
                  </div>
                ))}
                {groupNames.map((groupName) => (
                  <span key={groupName} className="w-full text-xs font-medium text-gray-500 mt-1 first:mt-0">{groupName}</span>
                ))}
                {groupNames.map((groupName) =>
                  withGroup
                    .filter((t) => t.group === groupName)
                    .map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleToppingDragStart(e, t.id)}
                        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-grab active:cursor-grabbing shadow-sm hover:border-orange-300 hover:shadow"
                      >
                        {t.name} +฿{t.price.toFixed(0)}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {specialRequests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">คำขอพิเศษที่ใช้กับเมนูนี้</label>
              <p className="text-xs text-gray-500 mb-2">ลากการ์ดมาวางด้านล่าง หรือคลิกที่แท็กเพื่อลบ</p>
              <div
                onDragOver={handleRequestDropZoneDragOver}
                onDrop={handleRequestDrop}
                onDragLeave={(e) => e.preventDefault()}
                className="min-h-[52px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-2 flex flex-wrap gap-2"
              >
                {requestIds.length === 0 ? (
                  <span className="text-xs text-gray-400 self-center">วางคำขอพิเศษที่นี่</span>
                ) : (
                  specialRequests
                    .filter((r) => requestIds.includes(r.id))
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRequestIds((prev) => prev.filter((id) => id !== r.id))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-sm font-medium hover:bg-orange-200 border border-orange-200"
                      >
                        {r.name} ✕
                      </button>
                    ))
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {specialRequests.map((r) => (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={(e) => handleRequestDragStart(e, r.id)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-grab active:cursor-grabbing shadow-sm hover:border-orange-300 hover:shadow"
                  >
                    {r.name}
                  </div>
                ))}
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
