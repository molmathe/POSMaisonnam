 "use client";

import { useState, FormEvent, DragEvent, ChangeEvent } from "react";

type Category = { id: number; name: string };
type Topping = { id: number; name: string; price: number; group?: string | null };
type SpecialRequest = { id: number; name: string };

interface Props {
  categories: Category[];
  toppings: Topping[];
  specialRequests: SpecialRequest[];
}

export default function MenuForm({ categories, toppings, specialRequests }: Props) {
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    if (id && !selectedToppingIds.includes(Number(id))) setSelectedToppingIds((prev) => [...prev, Number(id)]);
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
    if (id && !selectedRequestIds.includes(Number(id))) setSelectedRequestIds((prev) => [...prev, Number(id)]);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
  }

  async function uploadImageIfNeeded() {
    if (!file) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "อัปโหลดรูปภาพไม่สำเร็จ");
    }

    const data = await res.json();
    return data.url as string;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nameTh.trim() || !price || !categoryId) {
      setError("กรุณากรอกชื่อเมนู ราคา และหมวดหมู่");
      return;
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setError("กรุณากรอกราคาให้ถูกต้อง");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const uploadedUrl = await uploadImageIfNeeded();

      const res = await fetch("/api/admin/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameTh: nameTh.trim(),
          nameEn: nameEn.trim() || null,
          price: numericPrice,
          categoryId,
          imageUrl: uploadedUrl || null,
          toppingIds: selectedToppingIds,
          requestIds: selectedRequestIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถบันทึกเมนูได้");
      }
      setNameTh("");
      setNameEn("");
      setPrice("");
      setCategoryId("");
      setSelectedToppingIds([]);
      setSelectedRequestIds([]);
      setImageUrl(null);
      setFile(null);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          ชื่อเมนู (ภาษาไทย)
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
          placeholder="เช่น สเต๊กหมูพริกไทยดำ"
          value={nameTh}
          onChange={(e) => setNameTh(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          ชื่อเมนู (ภาษาอังกฤษ) <span className="text-gray-400">(ไม่บังคับ)</span>
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
          placeholder="เช่น Pork Steak Black Pepper"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700">
            ราคา (บาท)
          </label>
          <input
            type="number"
            min={0}
            step="1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
            placeholder="เช่น 159"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700">
            หมวดหมู่
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {toppings.length > 0 && (
        <div className="space-y-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700">
            Topping ที่แสดงบน POS <span className="text-gray-400">(ลากการ์ดมาวาง หรือคลิกแท็กเพื่อลบ)</span>
          </label>
          <div
            onDragOver={handleToppingDropZoneDragOver}
            onDrop={handleToppingDrop}
            onDragLeave={(e) => e.preventDefault()}
            className="min-h-[48px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-2 flex flex-wrap gap-2"
          >
            {selectedToppingIds.length === 0 ? (
              <span className="text-xs text-gray-400 self-center">วาง Topping ที่นี่</span>
            ) : (
              toppings
                .filter((t) => selectedToppingIds.includes(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedToppingIds((prev) => prev.filter((id) => id !== t.id))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-sm font-medium hover:bg-orange-200 border border-orange-200"
                  >
                    {t.name} +฿{t.price.toFixed(0)} ✕
                  </button>
                ))
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {toppings.map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleToppingDragStart(e, t.id)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm cursor-grab active:cursor-grabbing shadow-sm hover:border-orange-300 hover:shadow"
              >
                {t.name} +฿{t.price.toFixed(0)}
              </div>
            ))}
          </div>
        </div>
      )}

      {specialRequests.length > 0 && (
        <div className="space-y-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700">
            คำขอพิเศษที่แสดงบน POS <span className="text-gray-400">(ลากการ์ดมาวาง หรือคลิกแท็กเพื่อลบ)</span>
          </label>
          <div
            onDragOver={handleRequestDropZoneDragOver}
            onDrop={handleRequestDrop}
            onDragLeave={(e) => e.preventDefault()}
            className="min-h-[48px] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-2 flex flex-wrap gap-2"
          >
            {selectedRequestIds.length === 0 ? (
              <span className="text-xs text-gray-400 self-center">วางคำขอพิเศษที่นี่</span>
            ) : (
              specialRequests
                .filter((r) => selectedRequestIds.includes(r.id))
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRequestIds((prev) => prev.filter((id) => id !== r.id))}
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

      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          รูปภาพเมนู{" "}
          <span className="text-gray-400">
            (ลากรูปมาวาง หรือคลิกเพื่อเลือกไฟล์)
          </span>
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-lg px-3 py-4 text-xs md:text-sm cursor-pointer text-gray-500 ${
            dragOver ? "border-gray-800 bg-gray-50" : "border-gray-300"
          }`}
          onClick={() => {
            const input = document.getElementById(
              "menu-image-input"
            ) as HTMLInputElement | null;
            input?.click();
          }}
        >
          <input
            id="menu-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mb-1">
            ลากรูปเมนูมาวางที่นี่ หรือกดเพื่อเลือกไฟล์จากเครื่อง
          </p>
          <p className="text-[11px] text-gray-400">รองรับ JPG, PNG</p>
        </div>
        {imageUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">ตัวอย่างรูปเมนู</p>
            <img
              src={imageUrl}
              alt="ตัวอย่างรูปเมนู"
              className="h-24 w-auto max-w-full rounded-md border border-gray-200 object-cover bg-gray-50"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-sm md:text-base py-2.5 font-medium disabled:opacity-60 shadow-sm"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกเมนู"}
      </button>
    </form>
  );
}

