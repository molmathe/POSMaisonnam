"use client";

import { useState, useEffect } from "react";

type Employee = {
  id: number;
  name: string;
  dailyWage: number;
  attendances: { id: number; date: string }[];
};

function todayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function isCheckedToday(emp: Employee) {
  const tk = todayKey();
  return emp.attendances.some((a) => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return key === tk;
  });
}

export default function PosOwnerAttendance({
  onBack,
  onLogout,
}: {
  onBack: () => void;
  onLogout: () => void;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  const fetchEmployees = async () => {
    const res = await fetch("/api/admin/employees");
    if (!res.ok) return;
    const list: Employee[] = await res.json();
    const withAttendances = await Promise.all(
      list.map(async (emp) => {
        const r = await fetch(`/api/admin/attendance?employeeId=${emp.id}`);
        const atts = r.ok ? await r.json() : [];
        return { ...emp, attendances: atts };
      })
    );
    setEmployees(withAttendances);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const toggle = async (emp: Employee) => {
    const checked = isCheckedToday(emp);
    setLoading(emp.id);
    try {
      if (checked) {
        const tk = todayKey();
        const attend = emp.attendances.find((a) => {
          const d = new Date(a.date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return key === tk;
        });
        if (attend) {
          await fetch(`/api/admin/attendance/${attend.id}`, { method: "DELETE" });
          setEmployees((prev) =>
            prev.map((e) =>
              e.id === emp.id
                ? { ...e, attendances: e.attendances.filter((a) => a.id !== attend.id) }
                : e
            )
          );
        }
      } else {
        const res = await fetch("/api/admin/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: emp.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setEmployees((prev) =>
            prev.map((e) =>
              e.id === emp.id ? { ...e, attendances: [data, ...e.attendances] } : e
            )
          );
        }
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <button type="button" onClick={onBack} className="p-2 text-gray-500 hover:text-gray-800 transition-colors font-medium">
          ← กลับ
        </button>
        <span className="font-semibold text-gray-800">เช็คชื่อพนักงาน</span>
        <button type="button" onClick={onLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
          ออก
        </button>
      </header>

      <p className="px-3 py-2 text-sm text-gray-500">
        {new Date().toLocaleDateString("th-TH", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="flex-1 px-3 py-2 space-y-2">
        {employees.map((emp) => {
          const checked = isCheckedToday(emp);
          return (
            <button
              key={emp.id}
              type="button"
              disabled={loading === emp.id}
              onClick={() => toggle(emp)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 text-left transition-all ${
                checked ? "border-green-400 bg-green-50 shadow-sm" : "border-gray-100 bg-white hover:border-orange-200 hover:shadow-md shadow-sm"
              }`}
            >
              <div>
                <div className="font-medium text-gray-900">{emp.name}</div>
                <div className="text-xs text-gray-500">฿{emp.dailyWage.toFixed(0)} / วัน</div>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  checked ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white"
                }`}
              >
                {checked ? "✓" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
