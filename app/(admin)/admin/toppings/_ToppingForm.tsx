 "use client";

import { useState, FormEvent } from "react";

export default function ToppingForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [group, setGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError("กรุณากรอกชื่อตัวเลือกและราคา");
      return;
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setError("กรุณากรอกราคาให้ถูกต้อง");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/toppings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: numericPrice,
          group: group.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถบันทึก Topping ได้");
      }
      setName("");
      setPrice("");
      setGroup("");
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
          ชื่อ Topping
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
          placeholder="เช่น ไข่ดาว"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          ราคาเพิ่ม (บาท)
        </label>
        <input
          type="number"
          min={0}
          step="1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
          placeholder="เช่น 10"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          กลุ่ม (ไม่บังคับ)
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
          placeholder="เช่น ไข่ดาว — ใช้จัดกลุ่มบน POS"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-sm md:text-base py-2.5 font-medium disabled:opacity-60 shadow-sm"
      >
        {loading ? "กำลังบันทึก..." : "บันทึก Topping"}
      </button>
    </form>
  );
}

