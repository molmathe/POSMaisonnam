 "use client";

import { useState, FormEvent, DragEvent, ChangeEvent } from "react";

type Category = { id: number; name: string };
type Topping = { id: number; name: string; price: number };
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
      return imageUrl && !imageUrl.startsWith("blob:")
        ? imageUrl
        : imageUrl ?? null;
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
            Topping ที่แสดงบน POS <span className="text-gray-400">(ไม่เลือก = ไม่แสดง)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {toppings.map((t) => {
              const checked = selectedToppingIds.includes(t.id);
              return (
                <label key={t.id} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedToppingIds((prev) =>
                        checked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  <span>{t.name} (+฿{t.price.toFixed(0)})</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {specialRequests.length > 0 && (
        <div className="space-y-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700">
            คำขอพิเศษที่แสดงบน POS <span className="text-gray-400">(ไม่เลือก = ไม่แสดง)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {specialRequests.map((r) => {
              const checked = selectedRequestIds.includes(r.id);
              return (
                <label key={r.id} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedRequestIds((prev) =>
                        checked ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  <span>{r.name}</span>
                </label>
              );
            })}
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
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mb-1">
            ลากรูปเมนูมาวางที่นี่ หรือกดเพื่อเลือกไฟล์จากเครื่อง
          </p>
          <p className="text-[11px] text-gray-400">
            รองรับ JPG, PNG หรือใส่ URL ด้านล่าง
          </p>
        </div>
        <input
          type="url"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs mt-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="หรือใส่ URL รูปภาพ (เช่น /uploads/xxx.jpg)"
          value={imageUrl && !imageUrl.startsWith("blob:") ? imageUrl : ""}
          onChange={(e) => {
            const v = e.target.value.trim() || null;
            setImageUrl(v);
            if (v) setFile(null);
          }}
        />
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

