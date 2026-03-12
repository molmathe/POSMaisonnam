"use client";

import { useState, FormEvent } from "react";

export default function EmployeeForm() {
  const [name, setName] = useState("");
  const [dailyWage, setDailyWage] = useState("");
  const [role, setRole] = useState<"STAFF" | "OWNER">("STAFF");
  const [pinCode, setPinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dailyWage) {
      setError("กรุณากรอกชื่อพนักงานและค่าแรงรายวัน");
      return;
    }
    const wage = Number(dailyWage);
    if (Number.isNaN(wage) || wage < 0) {
      setError("กรุณากรอกค่าแรงรายวันให้ถูกต้อง");
      return;
    }
    if (role === "OWNER" && !pinCode.trim()) {
      setError("เจ้าของร้านต้องกำหนด PIN Code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dailyWage: wage,
          role,
          pinCode: role === "OWNER" ? pinCode.trim() : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ไม่สามารถบันทึกพนักงานได้");
      }
      setName("");
      setDailyWage("");
      setRole("STAFF");
      setPinCode("");
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
          ชื่อพนักงาน
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
          placeholder="เช่น คุณเอ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          ค่าแรงรายวัน (บาท)
        </label>
        <input
          type="number"
          min={0}
          step="1"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
          placeholder="เช่น 400"
          value={dailyWage}
          onChange={(e) => setDailyWage(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs md:text-sm font-medium text-gray-700">
          บทบาท
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
          value={role}
          onChange={(e) => setRole(e.target.value as "STAFF" | "OWNER")}
        >
          <option value="STAFF">พนักงาน (STAFF)</option>
          <option value="OWNER">เจ้าของร้าน (OWNER)</option>
        </select>
      </div>

      {role === "OWNER" && (
        <div className="space-y-1">
          <label className="block text-xs md:text-sm font-medium text-gray-700">
            PIN Code (สำหรับเข้าหน้า POS ฟังก์ชันพิเศษ)
          </label>
          <input
            type="text"
            maxLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="เช่น 9999"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
          />
          <p className="text-[11px] text-gray-400">
            PIN นี้ใช้สำหรับเปิดฟังก์ชันเช็คชื่อพนักงานในหน้า POS เท่านั้น
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 transition-colors text-white text-sm py-2.5 font-medium disabled:opacity-60 shadow-sm"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกพนักงาน"}
      </button>
    </form>
  );
}
