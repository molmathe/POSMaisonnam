"use client";

import { useState, useEffect } from "react";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "locked" | "unlocked">("loading");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("admin_unlocked") === "1") {
      setStatus("unlocked");
    } else {
      setStatus("locked");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || data.role !== "OWNER") {
        setError("รหัส PIN ไม่ถูกต้อง หรือไม่ใช่สิทธิ์เจ้าของร้าน");
        setPin("");
        return;
      }
      sessionStorage.setItem("admin_unlocked", "1");
      setStatus("unlocked");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;

  if (status === "locked") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-500 mt-1">กรุณากรอก PIN เจ้าของร้านเพื่อเข้าใช้งาน</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="w-full text-center text-2xl tracking-[0.4em] rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
