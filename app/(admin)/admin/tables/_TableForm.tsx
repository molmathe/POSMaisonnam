 "use client";

import { useState, FormEvent } from "react";

export default function TableForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อโต๊ะ");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถบันทึกโต๊ะได้");
      }
      setName("");
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
          ชื่อโต๊ะ
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800"
          placeholder="เช่น โต๊ะ 1, โต๊ะในสวน"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-sm md:text-base py-2.5 font-medium disabled:opacity-60 shadow-sm"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกโต๊ะ"}
      </button>
    </form>
  );
}

