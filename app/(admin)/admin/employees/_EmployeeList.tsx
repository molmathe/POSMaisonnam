"use client";

import { useState } from "react";

type Employee = {
  id: number;
  name: string;
  dailyWage: number;
  role: "STAFF" | "OWNER";
  pinCode: string | null;
};

interface Props {
  initialEmployees: Employee[];
}

export default function EmployeeList({ initialEmployees }: Props) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<Employee>>({});

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setDraft({
      name: emp.name,
      dailyWage: emp.dailyWage,
      role: emp.role,
      pinCode: emp.pinCode ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  async function saveEdit(id: number) {
    if (!draft.name || draft.dailyWage === undefined) return;
    const wage = Number(draft.dailyWage);
    if (Number.isNaN(wage) || wage < 0) {
      alert("กรุณากรอกค่าแรงรายวันให้ถูกต้อง");
      return;
    }
    if (draft.role === "OWNER" && !draft.pinCode) {
      alert("เจ้าของร้านต้องกำหนด PIN Code");
      return;
    }

    const old = employees;
    setEmployees(
      employees.map((e) =>
        e.id === id
          ? {
              ...e,
              name: String(draft.name),
              dailyWage: wage,
              role: draft.role as "STAFF" | "OWNER",
              pinCode:
                draft.role === "OWNER" ? (draft.pinCode as string) : null,
            }
          : e
      )
    );

    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          dailyWage: wage,
          role: draft.role,
          pinCode: draft.role === "OWNER" ? draft.pinCode : null,
        }),
      });
      if (!res.ok) throw new Error();
      setEditingId(null);
      setDraft({});
    } catch {
      setEmployees(old);
      alert("ไม่สามารถแก้ไขพนักงานได้");
    }
  }

  async function deleteEmployee(id: number) {
    if (!confirm("ต้องการลบพนักงานคนนี้หรือไม่?")) return;
    const old = employees;
    setEmployees(employees.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setEmployees(old);
      alert("ไม่สามารถลบพนักงานได้");
    }
  }

  if (employees.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        ยังไม่มีพนักงาน กรุณาเพิ่มพนักงานทางด้านซ้าย
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {employees.map((emp) => {
        const isEditing = editingId === emp.id;
        return (
          <div
            key={emp.id}
            className="border border-gray-100 rounded-xl px-3 md:px-4 py-3 bg-white"
          >
            {isEditing ? (
              <div className="space-y-2">
                <input
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  value={draft.name ?? ""}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="ชื่อพนักงาน"
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    min={0}
                    className="w-28 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-800"
                    value={draft.dailyWage ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, dailyWage: Number(e.target.value) }))
                    }
                    placeholder="ค่าแรงรายวัน"
                  />
                  <select
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-800"
                    value={draft.role ?? "STAFF"}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        role: e.target.value as "STAFF" | "OWNER",
                      }))
                    }
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                  {draft.role === "OWNER" && (
                    <input
                      type="text"
                      maxLength={8}
                      className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gray-800"
                      value={(draft.pinCode as string) ?? ""}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          pinCode: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder="PIN"
                    />
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => saveEdit(emp.id)}
                    className="px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-medium text-gray-900">
                      {emp.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        emp.role === "OWNER"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {emp.role === "OWNER" ? "เจ้าของร้าน" : "พนักงาน"}
                    </span>
                    {emp.role === "OWNER" && emp.pinCode && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        PIN: {emp.pinCode}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    ค่าแรงรายวัน ฿{emp.dailyWage.toFixed(0)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => startEdit(emp)}
                    className="px-2 md:px-3 py-1 rounded-lg border border-orange-200 text-xs text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    className="px-2 md:px-3 py-1 rounded-lg border border-red-200 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
